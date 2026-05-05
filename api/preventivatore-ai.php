<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metodo non consentito.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function euro(int $amount): string
{
    return '€' . number_format($amount, 0, ',', '.');
}

function buildEstimate(string $packageName, int $pagesEstimate, array $featureIds): string
{
    $packagePrices = [
        'Starter' => 169,
        'Professional' => 429,
        'Business' => 899,
    ];

    $pagePrices = [
        1 => 0,
        2 => 150,
        3 => 300,
        4 => 450,
        5 => 600,
        6 => 750,
        7 => 900,
        8 => 1050,
        10 => 1350,
        12 => 1650,
        14 => 1950,
    ];

    $featurePrices = [
        'seoAdvanced' => 80,
        'aiIntegration' => 250,
        'analyticsSetup' => 150,
        'blog' => 70,
        'ecommerce' => 250,
        'bookings' => 120,
        'maps' => 35,
        'social' => 25,
        'contactForm' => 60,
        'whatsapp' => 25,
        'gallery' => 55,
        'portfolio' => 85,
        'multilingual' => 140,
        'commercePolicy' => 250,
        'hosting' => 90,
        'domain' => 20,
        'quoteSystem' => 400,
    ];

    $total = $packagePrices[$packageName] ?? $packagePrices['Professional'];
    $nearestPageKey = array_reduce(array_keys($pagePrices), static function (?int $carry, int $key) use ($pagesEstimate): int {
        if ($carry === null) {
            return $key;
        }
        return abs($pagesEstimate - $key) < abs($pagesEstimate - $carry) ? $key : $carry;
    });

    $total += $pagePrices[$nearestPageKey] ?? 0;

    foreach ($featureIds as $featureId) {
        $total += $featurePrices[$featureId] ?? 0;
    }

    return 'Da ' . euro($total);
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '{}', true);

if (!is_array($payload)) {
    respond(422, [
        'success' => false,
        'message' => 'Payload non valido.'
    ]);
}

$description = trim((string) ($payload['initialDescription'] ?? ''));
$conversation = $payload['conversation'] ?? [];

if ($description === '') {
    respond(422, [
        'success' => false,
        'message' => 'Inserisci una descrizione del progetto.'
    ]);
}

if (!is_array($conversation)) {
    $conversation = [];
}

$apiKey = getenv('OPENAI_API_KEY') ?: '';
$model = getenv('OPENAI_MODEL') ?: 'gpt-4.1-mini';

if ($apiKey === '' || $apiKey === 'OPENAI_API_KEY_HERE') {
    respond(503, [
        'success' => false,
        'message' => 'Chiave OpenAI non configurata.'
    ]);
}

$allowedFeatureIds = [
    'seoAdvanced',
    'aiIntegration',
    'analyticsSetup',
    'blog',
    'ecommerce',
    'bookings',
    'maps',
    'social',
    'contactForm',
    'whatsapp',
    'gallery',
    'portfolio',
    'multilingual',
    'commercePolicy',
    'hosting',
    'domain',
    'quoteSystem',
];

$systemPrompt = <<<PROMPT
Tu sei Marco, consulente digitale senior di WebInbound — agenzia italiana che realizza siti web professionali per PMI e attività locali.

Il tuo compito è guidare il cliente verso un preventivo accurato attraverso una conversazione naturale, diretta e rassicurante.

IDENTITÀ E TONO:
- Parla come un consulente esperto che vuole capire davvero il progetto, non come un chatbot
- Italiano corretto, caldo ma professionale
- Frasi brevi. Mai più di 4 righe per messaggio
- Niente emoji, niente elenchi puntati nelle risposte al cliente
- Non usare mai parole come: schema, feature, package, JSON, sistema, elaborazione, analisi in corso
- Non dire mai che stai analizzando o elaborando qualcosa

FLUSSO CONVERSAZIONALE:
1. Prima risposta: dimostra di aver capito il settore e il tipo di attività. Fai UNA sola domanda, la più importante tra quelle mancanti
2. Seconda risposta: conferma quello che hai capito, fai al massimo UN'altra domanda se davvero serve
3. Dalla terza risposta in poi: se hai abbastanza dati, proponi una direzione chiara e invita a generare il preventivo. Non fare altre domande

QUANDO HAI ABBASTANZA DATI:
Hai abbastanza dati quando conosci: settore, tipo di sito desiderato, almeno 2 funzionalità chiave, dimensione indicativa del progetto.
In quel caso imposta hasEnoughData=true.

COME SCRIVERE replyPrimary:
- È il messaggio principale che il cliente vede
- Deve sembrare scritto da un consulente, non generato da una macchina
- Se stai ancora raccogliendo dati: fai una domanda sola, specifica, utile
- Se hai i dati: presenta il pacchetto consigliato spiegando il perché in 2-3 frasi naturali, poi di' che può generare il preventivo dettagliato
- Esempio corretto con dati sufficienti: "Per un ristorante con prenotazioni online la struttura più efficace è un sito Professional con 5-6 pagine. Serviranno menu digitale, gestione prenotazioni e integrazione Maps. Puoi generare il preventivo dettagliato."
- Esempio corretto senza dati: "Ho capito che si tratta di uno studio professionale. Prima di stimare il progetto, dimmi: l'obiettivo principale è ricevere richieste di consulenza o rafforzare l'autorevolezza online?"

COME SCRIVERE replyFollowup:
- Una riga sola, opzionale
- Serve solo per sottolineare un beneficio pratico o dare un'indicazione concreta
- Se non aggiunge valore, lasciala vuota

SETTORI:
ristorante, bar o caffetteria, hotel o B&B, impresa edile, palestra o centro fitness, studio professionale, negozio locale, e-commerce, startup, azienda tech, attività locale

PACCHETTI:
- Starter: siti semplici 1-3 pagine, attività che iniziano online
- Professional: siti completi 4-7 pagine, scelta standard per PMI
- Business: siti articolati 8+ pagine con funzionalità avanzate

Restituisci solo JSON valido, nessun testo fuori dallo schema.
PROMPT;

$messages = [
    ['role' => 'system', 'content' => $systemPrompt],
];

foreach ($conversation as $message) {
    if (!is_array($message)) {
        continue;
    }

    $role = (string) ($message['role'] ?? '');
    $content = trim((string) ($message['content'] ?? ''));

    if ($content === '' || !in_array($role, ['user', 'assistant'], true)) {
        continue;
    }

    $messages[] = [
        'role' => $role,
        'content' => $content,
    ];
}

if (count($messages) === 1) {
    $messages[] = [
        'role' => 'user',
        'content' => $description,
    ];
}

$requestBody = [
    'model' => $model,
    'temperature' => 0.3,
    'messages' => $messages,
    'response_format' => [
        'type' => 'json_schema',
        'json_schema' => [
            'name' => 'webinbound_project_analysis',
            'strict' => true,
            'schema' => [
                'type' => 'object',
                'additionalProperties' => false,
                'properties' => [
                    'businessType' => ['type' => 'string'],
                    'siteType' => ['type' => 'string'],
                    'objective' => ['type' => 'string'],
                    'recommendedPackage' => [
                        'type' => 'string',
                        'enum' => ['Starter', 'Professional', 'Business'],
                    ],
                    'pagesEstimate' => ['type' => 'integer'],
                    'featureIds' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'string',
                            'enum' => $allowedFeatureIds,
                        ],
                    ],
                    'missingQuestions' => [
                        'type' => 'array',
                        'items' => ['type' => 'string'],
                    ],
                    'hasEnoughData' => ['type' => 'boolean'],
                    'summary' => ['type' => 'string'],
                    'replyPrimary' => ['type' => 'string'],
                    'replyFollowup' => ['type' => 'string'],
                ],
                'required' => [
                    'businessType',
                    'siteType',
                    'objective',
                    'recommendedPackage',
                    'pagesEstimate',
                    'featureIds',
                    'missingQuestions',
                    'hasEnoughData',
                    'summary',
                    'replyPrimary',
                    'replyFollowup',
                ],
            ],
        ],
    ],
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_TIMEOUT => 45,
]);

$responseBody = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);

if ($responseBody === false || $curlError !== '') {
    respond(502, [
        'success' => false,
        'message' => 'Connessione al motore AI non riuscita.'
    ]);
}

$responseData = json_decode($responseBody, true);

if (!is_array($responseData) || $statusCode >= 400) {
    $message = 'Analisi AI non disponibile in questo momento.';
    if (is_array($responseData) && isset($responseData['error']['message'])) {
        $rawMessage = strtolower(trim((string) $responseData['error']['message']));

        if (str_contains($rawMessage, 'quota') || str_contains($rawMessage, 'billing')) {
            $message = 'La connessione OpenAI è attiva, ma il progetto API non ha quota disponibile.';
        } elseif (str_contains($rawMessage, 'authentication') || str_contains($rawMessage, 'api key')) {
            $message = 'La chiave OpenAI configurata non risulta valida.';
        }
    }

    respond(502, [
        'success' => false,
        'message' => $message
    ]);
}

$content = $responseData['choices'][0]['message']['content'] ?? '';
$analysis = json_decode((string) $content, true);

if (!is_array($analysis)) {
    respond(502, [
        'success' => false,
        'message' => 'Risposta AI non valida.'
    ]);
}

$featureIds = array_values(array_unique(array_filter(
    array_map('strval', $analysis['featureIds'] ?? []),
    static fn (string $featureId): bool => in_array($featureId, $allowedFeatureIds, true)
)));

$recommendedPackage = (string) ($analysis['recommendedPackage'] ?? 'Professional');
$pagesEstimate = max(1, (int) ($analysis['pagesEstimate'] ?? 5));
$estimateRange = buildEstimate($recommendedPackage, $pagesEstimate, $featureIds);

respond(200, [
    'success' => true,
    'mode' => 'openai',
    'analysis' => [
        'businessType' => trim((string) ($analysis['businessType'] ?? 'attività locale')),
        'siteType' => trim((string) ($analysis['siteType'] ?? 'sito web professionale')),
        'objective' => trim((string) ($analysis['objective'] ?? 'generare contatti e aumentare credibilità')),
        'recommendedPackage' => $recommendedPackage,
        'pagesEstimate' => $pagesEstimate,
        'featureIds' => $featureIds,
        'missingQuestions' => array_values(array_filter(array_map('strval', $analysis['missingQuestions'] ?? []))),
        'hasEnoughData' => (bool) ($analysis['hasEnoughData'] ?? false),
        'summary' => trim((string) ($analysis['summary'] ?? '')),
        'replyPrimary' => trim((string) ($analysis['replyPrimary'] ?? '')),
        'replyFollowup' => trim((string) ($analysis['replyFollowup'] ?? '')),
        'estimateRange' => $estimateRange,
    ],
]);
