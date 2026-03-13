<?php

declare(strict_types=1);

function wbEscape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function wbFormatDateTime(DateTimeImmutable $dateTime): string
{
    return $dateTime->format('d/m/Y H:i');
}

function wbRenderDefinitionRows(array $fields): string
{
    $html = '';

    foreach ($fields as $label => $value) {
        if ($value === null || $value === '') {
            continue;
        }

        $displayValue = is_array($value)
            ? implode(', ', array_map(static fn ($item) => wbEscape((string) $item), $value))
            : nl2br(wbEscape((string) $value));

        $html .= sprintf(
            '<tr><td style="padding:0 0 12px; width:220px; vertical-align:top; color:#5b6b64; font-size:14px; font-weight:700;">%s</td><td style="padding:0 0 12px; color:#13221c; font-size:14px; line-height:1.6;">%s</td></tr>',
            wbEscape($label),
            $displayValue
        );
    }

    return $html;
}

function wbRenderSection(string $title, array $fields): string
{
    $rows = wbRenderDefinitionRows($fields);

    if ($rows === '') {
        return '';
    }

    return sprintf(
        '<section style="margin:0 0 22px; padding:24px; background:#f7faf8; border:1px solid #dfe8e2; border-radius:18px;">
            <h2 style="margin:0 0 18px; font-size:18px; line-height:1.2; color:#10211a;">%s</h2>
            <table role="presentation" style="width:100%%; border-collapse:collapse;">%s</table>
        </section>',
        wbEscape($title),
        $rows
    );
}

function buildRequestEmailHtml(array $payload): string
{
    $siteName = wbEscape($payload['site_name'] ?? 'WebInbound');
    $submittedAt = wbEscape($payload['submitted_at'] ?? '');

    $customerSection = wbRenderSection('Dati cliente', [
        'Nome' => $payload['first_name'] ?? '',
        'Cognome' => $payload['last_name'] ?? '',
        'Email' => $payload['email'] ?? '',
        'Telefono' => $payload['phone'] ?? '',
        'Citta' => $payload['city'] ?? '',
    ]);

    $businessSection = wbRenderSection('Dati attività', [
        'Azienda / attività' => $payload['company'] ?? '',
        'Settore' => $payload['industry'] ?? '',
    ]);

    $projectSection = wbRenderSection('Dati progetto', [
        'Modalità scelta' => $payload['selected_mode'] ?? '',
        'Tipo progetto' => $payload['project_type'] ?? '',
        'Pacchetto selezionato' => $payload['selected_package'] ?? '',
        'Numero pagine' => $payload['page_count'] ?? '',
        'Funzionalità selezionate' => $payload['selected_features'] ?? [],
        'Prompt AI' => $payload['ai_prompt'] ?? '',
        'Stima AI' => $payload['ai_estimate'] ?? '',
    ]);

    $quoteSection = wbRenderSection('Riepilogo preventivo', [
        'Stima prezzo' => $payload['estimated_price'] ?? '',
        'Tempi stimati' => $payload['estimated_timeline'] ?? '',
        'Riepilogo configurazione' => $payload['quote_summary'] ?? '',
    ]);

    $messageSection = wbRenderSection('Messaggio finale', [
        'Messaggio del cliente' => $payload['final_message'] ?? '',
    ]);

    return <<<HTML
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuova richiesta dal sito WebInbound</title>
  </head>
  <body style="margin:0; padding:32px 16px; background:#eef4f0; font-family:Arial, Helvetica, sans-serif; color:#13221c;">
    <div style="max-width:760px; margin:0 auto; background:#ffffff; border-radius:28px; overflow:hidden; box-shadow:0 18px 60px rgba(16,33,26,0.08);">
      <div style="padding:34px 32px; background:linear-gradient(135deg, #0f1f19 0%, #163328 55%, #1da35b 100%); color:#ffffff;">
        <div style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; opacity:0.82; font-weight:700;">WebInbound</div>
        <h1 style="margin:12px 0 10px; font-size:30px; line-height:1.1;">Nuova richiesta dal sito {$siteName}</h1>
        <p style="margin:0; font-size:15px; line-height:1.6; color:rgba(255,255,255,0.86);">
          È arrivata una nuova richiesta contatto / preventivo dal configuratore del sito.
        </p>
      </div>

      <div style="padding:32px;">
        {$customerSection}
        {$businessSection}
        {$projectSection}
        {$quoteSection}
        {$messageSection}

        <section style="padding:20px 24px; background:#10211a; border-radius:18px; color:#ffffff;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.12em; opacity:0.75; margin-bottom:8px;">Dettagli invio</div>
          <p style="margin:0; font-size:14px; line-height:1.7; color:rgba(255,255,255,0.9);">
            Data e ora invio: <strong>{$submittedAt}</strong>
          </p>
        </section>
      </div>
    </div>
  </body>
</html>
HTML;
}

function buildRequestEmailText(array $payload): string
{
    $lines = [
        'Nuova richiesta dal sito WebInbound',
        str_repeat('=', 34),
        '',
        'DATI CLIENTE',
        'Nome: ' . ($payload['first_name'] ?? '-'),
        'Cognome: ' . ($payload['last_name'] ?? '-'),
        'Email: ' . ($payload['email'] ?? '-'),
        'Telefono: ' . ($payload['phone'] ?? '-'),
        'Citta: ' . ($payload['city'] ?? '-'),
        '',
        'DATI ATTIVITA',
        'Azienda / attività: ' . ($payload['company'] ?? '-'),
        'Settore: ' . ($payload['industry'] ?? '-'),
        '',
        'DATI PROGETTO',
        'Modalità scelta: ' . ($payload['selected_mode'] ?? '-'),
        'Tipo progetto: ' . ($payload['project_type'] ?? '-'),
        'Pacchetto selezionato: ' . ($payload['selected_package'] ?? '-'),
        'Numero pagine: ' . ($payload['page_count'] ?? '-'),
        'Funzionalità selezionate: ' . (!empty($payload['selected_features']) ? implode(', ', (array) $payload['selected_features']) : '-'),
        'Prompt AI: ' . ($payload['ai_prompt'] ?? '-'),
        'Stima AI: ' . ($payload['ai_estimate'] ?? '-'),
        '',
        'RIEPILOGO PREVENTIVO',
        'Stima prezzo: ' . ($payload['estimated_price'] ?? '-'),
        'Tempi stimati: ' . ($payload['estimated_timeline'] ?? '-'),
        'Riepilogo configurazione: ' . ($payload['quote_summary'] ?? '-'),
        '',
        'MESSAGGIO FINALE',
        ($payload['final_message'] ?? '-') !== '' ? (string) ($payload['final_message'] ?? '-') : '-',
        '',
        'Data e ora invio: ' . ($payload['submitted_at'] ?? '-'),
    ];

    return implode(PHP_EOL, $lines);
}

function buildCustomerConfirmationEmailHtml(array $payload): string
{
    $siteName = wbEscape($payload['site_name'] ?? 'WebInbound');
    $firstName = wbEscape($payload['first_name'] ?? 'Cliente');
    $estimatedPrice = wbEscape($payload['estimated_price'] ?? 'In definizione');
    $estimatedTimeline = wbEscape($payload['estimated_timeline'] ?? 'Da confermare');
    $selectedPackage = wbEscape($payload['selected_package'] ?? 'Configurazione personalizzata');
    $pageCount = wbEscape($payload['page_count'] ?? 'Da definire');
    $submittedAt = wbEscape($payload['submitted_at'] ?? '');
    $quoteSummary = wbEscape($payload['quote_summary'] ?? 'Ricevuta correttamente.');
    $summaryCards = implode('', [
        wbRenderMobileSummaryCard('Pacchetto', $selectedPackage),
        wbRenderMobileSummaryCard('Numero pagine', $pageCount),
        wbRenderMobileSummaryCard('Investimento indicativo', $estimatedPrice),
        wbRenderMobileSummaryCard('Tempi stimati', $estimatedTimeline),
        wbRenderMobileSummaryCard('Dettagli richiesta', $quoteSummary),
    ]);

    return <<<HTML
<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conferma ricezione richiesta</title>
  </head>
  <body style="margin:0; padding:24px 12px; background:#eef4f0; font-family:Arial, Helvetica, sans-serif; color:#13221c;">
    <div style="max-width:760px; margin:0 auto; background:#ffffff; border-radius:28px; overflow:hidden; box-shadow:0 18px 60px rgba(16,33,26,0.08);">
      <div style="padding:30px 22px; background:#f2fbf5; color:#173f2d; border-bottom:1px solid #d8ebde;">
        <div style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:#2f7d57; font-weight:700;">WebInbound</div>
        <h1 style="margin:12px 0 10px; font-size:28px; line-height:1.1; color:#173f2d;">Richiesta inviata correttamente</h1>
        <p style="margin:0; font-size:15px; line-height:1.7; color:#456457;">
          Ciao {$firstName}, abbiamo ricevuto la tua richiesta e ti ricontatteremo il prima possibile.
        </p>
      </div>

      <div style="padding:24px 18px 28px;">
        <section style="margin:0 0 18px; padding:20px 16px; background:#ffffff; border:1px solid #dfe8e2; border-radius:20px;">
          <h2 style="margin:0 0 16px; font-size:20px; line-height:1.2; color:#10211a;">Riepilogo della tua richiesta</h2>
          <div style="font-size:14px; line-height:1.6; color:#4a5c54; margin-bottom:14px;">
            Ti confermiamo che la tua richiesta è stata registrata correttamente nei sistemi WebInbound.
          </div>
          {$summaryCards}
        </section>

        <section style="margin:0 0 18px; padding:20px 16px; background:#f8fcf9; border:1px solid #dceae0; border-radius:20px;">
          <p style="margin:0; font-size:15px; line-height:1.8; color:#32423b;">
            Il team {$siteName} analizzerà la richiesta e ti ricontatterà all’indirizzo email o al numero che hai inserito.
          </p>
        </section>

        <section style="padding:18px 16px; background:#1e5d3f; border-radius:20px; color:#ffffff;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(255,255,255,0.78); margin-bottom:8px;">Conferma ricezione</div>
          <p style="margin:0; font-size:14px; line-height:1.7; color:#ffffff;">
            Richiesta registrata il <strong>{$submittedAt}</strong>
          </p>
        </section>
      </div>
    </div>
  </body>
</html>
HTML;
}

function wbRenderMobileSummaryCard(string $label, string $value): string
{
    return sprintf(
        '<div style="margin:0 0 12px; padding:14px 14px 13px; background:#f3faf6; border:1px solid #d8ebde; border-radius:16px;">
            <div style="font-size:12px; line-height:1.3; text-transform:uppercase; letter-spacing:0.08em; color:#547464; font-weight:700; margin-bottom:6px;">%s</div>
            <div style="font-size:15px; line-height:1.65; color:#13221c; font-weight:600; word-break:break-word;">%s</div>
        </div>',
        wbEscape($label),
        nl2br(wbEscape($value))
    );
}

function buildCustomerConfirmationEmailText(array $payload): string
{
    $lines = [
        'Richiesta inviata correttamente',
        '',
        'Abbiamo ricevuto la tua richiesta e ti ricontatteremo il prima possibile.',
        '',
        'Pacchetto: ' . ($payload['selected_package'] ?? '-'),
        'Numero pagine: ' . ($payload['page_count'] ?? '-'),
        'Investimento indicativo: ' . ($payload['estimated_price'] ?? '-'),
        'Tempi stimati: ' . ($payload['estimated_timeline'] ?? '-'),
        'Dettagli: ' . ($payload['quote_summary'] ?? '-'),
        '',
        'Data richiesta: ' . ($payload['submitted_at'] ?? '-'),
        '',
        'WebInbound',
    ];

    return implode(PHP_EOL, $lines);
}
