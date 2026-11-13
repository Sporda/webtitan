<?php
declare(strict_types=1);
/*
 * Router pro nginx z panelu: `index index.php index.html` a `try_files $uri $uri/ /index.php?$query_string`.
 * - "/"            -> obsah index.html (200, ETag/Last-Modified, 304 při shodě)
 * - neexistující   -> 404.html se stavem 404
 * Ostatní soubory (podstránky, assets, api/*.php) obsluhuje nginx přímo, sem se nedostanou.
 */
header_remove('X-Powered-By');
$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$head = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD';
header('Content-Type: text/html; charset=utf-8');

if ($path === '/' || $path === '/index.php') {
    $file = __DIR__ . '/index.html';
    $mtime = (int) filemtime($file);
    $etag = '"' . dechex($mtime) . '-' . dechex((int) filesize($file)) . '"';
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');
    header('ETag: ' . $etag);
    header('Cache-Control: no-cache');
    $inm = (string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? '');
    if ($inm !== '' && (trim($inm) === $etag || trim($inm) === 'W/' . $etag)) {
        http_response_code(304);
        exit;
    }
    http_response_code(200);
} else {
    $file = __DIR__ . '/404.html';
    http_response_code(404);
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex');
}
if (!$head) {
    readfile($file);
}
