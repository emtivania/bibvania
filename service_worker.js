// BibVania — service_worker.js
// Service Worker genérico para forçar download de arquivos via URL.
// Intercepta qualquer página que receba ?bibdownload=1&url=<encoded>&nome=<encoded>

const SW_VERSION = '1.0.0';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Age em qualquer página que tenha ?bibdownload=1
  if (url.searchParams.get('bibdownload') === '1') {
    const fileUrl  = url.searchParams.get('url');
    const fileName = decodeURIComponent(url.searchParams.get('nome') || 'documento.pdf');

    if (!fileUrl) return; // deixa passar normalmente

    event.respondWith(
      fetch(fileUrl)
        .then(resp => {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.blob();
        })
        .then(blob => new Response(blob, {
          status: 200,
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          }
        }))
        .catch(err => new Response('Erro ao baixar: ' + err.message, { status: 502 }))
    );
  }
  // Todas as outras requisições passam normalmente
});
