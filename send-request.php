<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require_once __DIR__ . '/backend/includes/request-mail-template.php';

$config = require __DIR__ . '/backend/config/mail-config.php';

loadMailerDependencies(__DIR__);

/**
 * Main request handler for WebInbound contact / quote submissions.
 */
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(405, false, 'Metodo non consentito.', $config);
    }

    if (!empty($_POST['website'])) {
        respond(200, true, 'Richiesta inviata con successo.', $config);
    }

    $payload = collectPayload($_POST, $config);
    validatePayload($payload);

    $internalMailer = buildInternalMailer($config, $payload);
    $internalMailer->send();

    if ($payload['email'] !== '') {
        $customerMailer = buildCustomerConfirmationMailer($config, $payload);
        $customerMailer->send();
    }

    respond(200, true, 'Richiesta inviata correttamente. Ti ricontatteremo al più presto.', $config);
} catch (RuntimeException $exception) {
    error_log('[WebInbound][send-request] ' . $exception->getMessage());
    respond(422, false, $exception->getMessage(), $config);
} catch (Exception $exception) {
    error_log('[WebInbound][send-request][mailer] ' . $exception->getMessage());
    respond(500, false, 'Si è verificato un problema durante l\'invio. Riprova tra pochi minuti.', $config);
} catch (Throwable $throwable) {
    error_log('[WebInbound][send-request][fatal] ' . $throwable->getMessage());
    respond(500, false, 'Si è verificato un problema durante l\'invio. Riprova tra pochi minuti.', $config);
}

function loadMailerDependencies(string $basePath): void
{
    $autoloadPath = $basePath . '/vendor/autoload.php';
    if (is_file($autoloadPath)) {
        require_once $autoloadPath;
        return;
    }

    $phpMailerPath = $basePath . '/lib/PHPMailer/src/PHPMailer.php';
    $smtpPath = $basePath . '/lib/PHPMailer/src/SMTP.php';
    $exceptionPath = $basePath . '/lib/PHPMailer/src/Exception.php';

    if (is_file($phpMailerPath) && is_file($smtpPath) && is_file($exceptionPath)) {
        require_once $exceptionPath;
        require_once $smtpPath;
        require_once $phpMailerPath;
        return;
    }

    throw new RuntimeException(
        'PHPMailer non è installato. Esegui "composer install" oppure carica la libreria in /lib/PHPMailer/.'
    );
}

function configureMailer(array $config): PHPMailer
{
    $mailer = new PHPMailer(true);
    $mailer->CharSet = 'UTF-8';
    $mailer->isSMTP();
    $mailer->Host = (string) $config['smtp']['host'];
    $mailer->Port = (int) $config['smtp']['port'];
    $mailer->SMTPAuth = (bool) $config['smtp']['auth'];
    $mailer->Username = (string) $config['smtp']['username'];
    $mailer->Password = (string) $config['smtp']['password'];

    $encryption = (string) ($config['smtp']['encryption'] ?? '');
    if ($encryption === 'ssl') {
        $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($encryption === 'tls') {
        $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    return $mailer;
}

function buildInternalMailer(array $config, array $payload): PHPMailer
{
    $mailer = configureMailer($config);
    $mailer->setFrom((string) $config['from']['email'], (string) $config['from']['name']);
    $mailer->addAddress((string) $config['recipient_email']);
    if ($payload['email'] !== '') {
        $mailer->addReplyTo($payload['email'], trim($payload['first_name'] . ' ' . $payload['last_name']));
    }
    $mailer->isHTML(true);
    $mailer->Subject = (string) $config['subject'];
    $mailer->Body = buildRequestEmailHtml($payload);
    $mailer->AltBody = buildRequestEmailText($payload);

    return $mailer;
}

function buildCustomerConfirmationMailer(array $config, array $payload): PHPMailer
{
    $mailer = configureMailer($config);
    $mailer->setFrom((string) $config['from']['email'], (string) $config['from']['name']);
    $mailer->addAddress($payload['email'], trim($payload['first_name'] . ' ' . $payload['last_name']));
    $mailer->isHTML(true);
    $mailer->Subject = 'Conferma ricezione richiesta - WebInbound';
    $mailer->Body = buildCustomerConfirmationEmailHtml($payload);
    $mailer->AltBody = buildCustomerConfirmationEmailText($payload);

    return $mailer;
}

function collectPayload(array $input, array $config): array
{
    $romeTime = new DateTimeZone('Europe/Rome');
    $submittedAt = new DateTimeImmutable('now', $romeTime);

    $selectedFeatures = normalizeArray($input['selected_features'] ?? []);

    return [
        'site_name' => (string) ($config['site_name'] ?? 'WebInbound'),
        'first_name' => sanitizeText($input['first_name'] ?? ''),
        'last_name' => sanitizeText($input['last_name'] ?? ''),
        'email' => sanitizeEmail($input['email'] ?? ''),
        'phone' => sanitizeText($input['phone'] ?? ''),
        'company' => sanitizeText($input['company'] ?? ''),
        'industry' => sanitizeText($input['industry'] ?? ''),
        'city' => sanitizeText($input['city'] ?? ''),
        'project_type' => sanitizeText($input['project_type'] ?? ''),
        'selected_package' => sanitizeText($input['selected_package'] ?? ''),
        'page_count' => sanitizeText($input['page_count'] ?? ''),
        'selected_features' => $selectedFeatures,
        'estimated_price' => sanitizeText($input['estimated_price'] ?? ''),
        'estimated_timeline' => sanitizeText($input['estimated_timeline'] ?? ''),
        'selected_mode' => sanitizeText($input['selected_mode'] ?? ''),
        'quote_summary' => sanitizeTextarea($input['quote_summary'] ?? ''),
        'ai_prompt' => sanitizeTextarea($input['ai_prompt'] ?? ''),
        'ai_estimate' => sanitizeText($input['ai_estimate'] ?? ''),
        'final_message' => sanitizeTextarea($input['final_message'] ?? ''),
        'privacy_consent' => !empty($input['privacy_consent']),
        'redirect_url' => sanitizeUrl($input['redirect_url'] ?? ''),
        'submitted_at' => wbFormatDateTime($submittedAt),
    ];
}

function validatePayload(array $payload): void
{
    if ($payload['first_name'] === '') {
        throw new RuntimeException('Inserisci il nome.');
    }

    if ($payload['email'] === '' && $payload['phone'] === '') {
        throw new RuntimeException('Inserisci almeno un recapito: email oppure telefono.');
    }

    if ($payload['email'] !== '' && !filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Inserisci un indirizzo email valido.');
    }

    if ($payload['privacy_consent'] !== true) {
        throw new RuntimeException('Devi accettare la privacy policy per inviare la richiesta.');
    }
}

function sanitizeText(mixed $value): string
{
    $value = is_scalar($value) ? (string) $value : '';
    $value = trim(strip_tags($value));
    $value = preg_replace('/[\r\n\t]+/', ' ', $value) ?? '';

    return mb_substr($value, 0, 250);
}

function sanitizeTextarea(mixed $value): string
{
    $value = is_scalar($value) ? (string) $value : '';
    $value = trim(strip_tags($value));
    $value = preg_replace("/\r\n|\r/", "\n", $value) ?? '';
    $value = preg_replace("/\n{3,}/", "\n\n", $value) ?? '';

    return mb_substr($value, 0, 4000);
}

function sanitizeEmail(mixed $value): string
{
    $value = is_scalar($value) ? trim((string) $value) : '';
    $sanitized = filter_var($value, FILTER_SANITIZE_EMAIL);

    return is_string($sanitized) ? $sanitized : '';
}

function sanitizeUrl(mixed $value): string
{
    $value = is_scalar($value) ? trim((string) $value) : '';
    if ($value === '') {
        return '';
    }

    $sanitized = filter_var($value, FILTER_SANITIZE_URL);

    return is_string($sanitized) ? $sanitized : '';
}

function normalizeArray(mixed $value): array
{
    if (!is_array($value)) {
        $value = [$value];
    }

    $items = [];
    foreach ($value as $item) {
        $sanitized = sanitizeText($item);
        if ($sanitized !== '') {
            $items[] = $sanitized;
        }
    }

    return array_values(array_unique($items));
}

function wantsJsonResponse(): bool
{
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';

    return str_contains($accept, 'application/json') || strtolower($requestedWith) === 'xmlhttprequest';
}

function respond(int $statusCode, bool $success, string $message, array $config): never
{
    http_response_code($statusCode);

    if (wantsJsonResponse()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => $success,
            'message' => $message,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $redirectUrl = '';
    if (!empty($_POST['redirect_url'])) {
        $redirectUrl = sanitizeUrl($_POST['redirect_url']);
    } elseif (!empty($config['success_redirect']) && $success) {
        $redirectUrl = sanitizeUrl((string) $config['success_redirect']);
    }

    if ($redirectUrl !== '') {
        $separator = str_contains($redirectUrl, '?') ? '&' : '?';
        header('Location: ' . $redirectUrl . $separator . 'status=' . ($success ? 'success' : 'error'));
        exit;
    }

    header('Content-Type: text/html; charset=UTF-8');
    $title = $success ? 'Richiesta inviata con successo' : 'Invio non riuscito';
    $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

    echo <<<HTML
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$safeTitle}</title>
    <style>
      body{margin:0; font-family:Arial,Helvetica,sans-serif; background:#eef4f0; color:#13221c; display:grid; place-items:center; min-height:100vh; padding:24px}
      .card{max-width:560px; background:#fff; border-radius:24px; padding:32px; box-shadow:0 24px 50px rgba(16,33,26,.08); border:1px solid #dfe8e2}
      h1{margin:0 0 12px; font-size:30px}
      p{margin:0; line-height:1.7; color:#4b5a54}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>{$safeTitle}</h1>
      <p>{$safeMessage}</p>
    </div>
  </body>
</html>
HTML;
    exit;
}
