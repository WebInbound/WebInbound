<?php

declare(strict_types=1);

return [
    'site_name' => 'WebInbound',
    'recipient_email' => 'info@webinbound.it',
    'subject' => 'Richiesta dal sito',
    'smtp' => [
        'host' => 'smtps.aruba.it',
        'port' => 465,
        'encryption' => 'ssl', // tls oppure ssl
        'username' => 'info@webinbound.it',
        'password' => 'INSERISCI_LA_PASSWORD_SMTP',
        'auth' => true,
    ],
    'from' => [
        'email' => 'info@webinbound.it',
        'name' => 'WebInbound',
    ],
    'success_redirect' => '',
];
