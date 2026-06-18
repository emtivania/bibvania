/* ============================================================================
 * BibVania — service_worker.js  |  Force Download de Arquivos Remotos
 * ============================================================================
 * PROPÓSITO
 *   Service Worker genérico que intercepta requisições com o parâmetro
 *   ?bibdownload=1 e força o download do arquivo no navegador (em vez de
 *   abri-lo numa aba), via fetch + blob + Content-Disposition: attachment.
 *   Sem este SW, links diretos a PDFs abrem inline no navegador em vez de
 *   baixar (regra 18 do bibinit.claude).
 *
 * REGISTRO E ESCOPO
 *   Registrado apenas por bibfiles.html, via:
 *     navigator.serviceWorker.register('./service_worker.js', { scope: './' })
 *   Nenhuma outra página do projeto registra este SW. skipWaiting() +
 *   clients.claim() garantem ativação imediata, sem esperar reload ou
 *   aba antiga ser fechada.
 *
 * PARÂMETROS DE URL INTERCEPTADOS
 *   ?bibdownload=1          — flag de ativação; sem ela, requisição passa normal
 *   &url=<URL encoded>      — URL remota do arquivo a baixar (whitelist abaixo)
 *   &nome=<nome encoded>    — nome de arquivo sugerido ao usuário (sanitizado)
 *
 * SEGURANÇA — DUAS PROTEÇÕES OBRIGATÓRIAS (não remover)
 *   1. WHITELIST DE DOMÍNIOS (mitigação B1 — SSRF)
 *      Apenas archive.org e s3.us.archive.org (e subdomínios) podem ser
 *      buscados via &url=. Qualquer outro host retorna HTTP 403 antes de
 *      qualquer fetch ser disparado. Evita que o SW seja usado como proxy
 *      para acessar URLs arbitrárias (ex.: endpoints internos, metadata de
 *      cloud) a partir do navegador do usuário.
 *   2. SANITIZAÇÃO DO FILENAME (mitigação I7 — header injection)
 *      &nome= passa por decodeURIComponent() e remove aspas, \r, \n e
 *      barra invertida antes de entrar no header Content-Disposition.
 *      Sem isso, um nome de arquivo malicioso poderia injetar CR/LF e
 *      forjar headers HTTP adicionais na resposta.
 *
 * FLUXO DE RESPOSTA
 *   bibdownload=1 + url ausente → deixa passar normalmente (sem respondWith)
 *   url fora da whitelist        → 403 "URL não permitida"
 *   url malformada (new URL())   → 400 "URL inválida"
 *   fetch falha ou !resp.ok      → 502 "Erro ao baixar: <mensagem>"
 *   sucesso                      → 200, blob da URL remota, headers
 *                                   Content-Type: application/octet-stream
 *                                   Content-Disposition: attachment; filename="<nome>"
 *
 * VERSIONAMENTO
 *   SW_VERSION ('1.0.0') é apenas informativo nesta versão — não há lógica
 *   de cache versionado (este SW não usa Cache API, só intercepta fetch
 *   sob demanda). Sincronizar manualmente com releases caso passe a ser
 *   usado para invalidação de cache no futuro.
 * ============================================================================ */

const SW_VERSION = '1.0.0';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Age em qualquer página que tenha ?bibdownload=1
  if (url.searchParams.get('bibdownload') === '1') {
    const fileUrl  = url.searchParams.get('url');
    // I7 — sanitizar filename para evitar quebra do header Content-Disposition
    const fileName = decodeURIComponent(url.searchParams.get('nome') || 'documento.pdf')
        .replace(/["\r\n\\]/g, '_');

    if (!fileUrl) return; // deixa passar normalmente

    // B1 — whitelist de domínios permitidos (evita SSRF)
    try {
      const parsedUrl = new URL(fileUrl);
      const DOMINIOS_PERMITIDOS = ['archive.org', 's3.us.archive.org'];
      if (!DOMINIOS_PERMITIDOS.some(d => parsedUrl.hostname === d || parsedUrl.hostname.endsWith('.' + d))) {
        event.respondWith(new Response('URL não permitida', { status: 403 }));
        return;
      }
    } catch {
      event.respondWith(new Response('URL inválida', { status: 400 }));
      return;
    }

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
