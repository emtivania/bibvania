/**
 * BibSpeech API da BibVania
 * Description: Leitor de Tela para bibliotecas baseadas no projeto BibVania.
 * Version: 1.1
 * Year: 2026
 * Author: Ruan Oliveira Lima
 * Licence: CC-BY-4.0
 * Based on Web Speech API by W3C
 *
 * USO EM QUALQUER PÁGINA:
 *   1. Inclua: <script src="bibspeech_api.js"></script>  (antes do </body>)
 *   2. O script injeta automaticamente o CSS, o painel e o popup no DOM.
 *   3. No botão de ativar, use: onclick="abrirLeitorTela()"
 *      O botão deve ter id="leitorTelaBtn".
 *
 * FUNÇÕES PÚBLICAS:
 *   abrirLeitorTela()           — abre o leitor
 *   fecharLeitorTela()          — fecha o leitor
 *   fecharLeitorInteragirPopup()— fecha o popup de interação
 *   leitorExecutarInteracao()   — dispara interação no elemento focado
 */

(function () {

    var _VERSION = '1.1';

    /* Caminho base do script — garante que assets como bibspeech-logo.png
       sejam resolvidos relativamente ao JS, não à página HTML. */
    var _scriptBase = (function() {
        var s = document.currentScript && document.currentScript.src;
        return s ? s.substring(0, s.lastIndexOf('/') + 1) : '';
    })();

    /* ══════════════════════════════════════════════════
       1. CSS — injetado dinamicamente no <head>
    ══════════════════════════════════════════════════ */
    var _css = `
        #leitorTelaPanel {
            display: none;
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            z-index: 99999;
            background: rgba(100, 116, 139, 0.55);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            padding: 0.5rem 0.8rem 0.5rem 0.8rem;
            width: 220px;
            box-sizing: border-box;
            font-family: inherit;
            animation: leitorSlideIn 0.25s ease;
            text-align: center;
        }
        #leitorTelaPanel .leitor-logo {
            display: block;
            width: 64px;
            height: 64px;
            object-fit: contain;
            margin: 0.2rem auto 0;
            opacity: 0.93;
        }
        #leitorTelaPanel.ativo { display: block; }
        @keyframes leitorSlideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        #leitorTelaPanel .leitor-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.2rem;
            gap: 0.4rem;
        }
        #leitorTelaPanel .leitor-titulo {
            font-size: 0.85rem;
            font-weight: 700;
            letter-spacing: 0.02em;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            text-align: left;
            flex: 1;
        }
        #leitorTelaPanel .leitor-fechar {
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.15s;
        }
        #leitorTelaPanel .leitor-fechar:hover { background: rgba(255,255,255,0.35); }
        #leitorTelaPanel .leitor-instrucao {
            font-size: 0.78rem;
            opacity: 0.85;
            line-height: 1.3;
            word-break: break-word;
            text-align: center;
            margin: 0;
        }
        #leitorTelaPanel .leitor-rodape {
            text-align: center;
            font-size: 0.62rem;
            margin-top: 0.2rem;
            opacity: 0.45;
            margin-top: 0.6rem;
            letter-spacing: 0.04em;
        }
        #leitorTelaPanel .leitor-instrucao em {
            font-style: normal;
            font-weight: 700;
            color: #ffe082;
        }
        #leitorInteragirPopup {
            display: none;
            position: fixed;
            z-index: 999999;
            background: #fff;
            color: #1a237e;
            border: 2px solid var(--primary, #1a237e);
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            padding: 0.5rem 0.7rem;
            font-size: 0.82rem;
            pointer-events: auto;
            width: 200px;
            animation: leitorSlideIn 0.15s ease;
        }
        #leitorInteragirPopup .lip-texto {
            font-weight: 600;
            margin-bottom: 0.4rem;
            word-break: break-word;
            opacity: 0.7;
            font-size: 0.75rem;
        }
        #leitorInteragirPopup .lip-btns { display: flex; flex-direction: column; gap: 0.35rem; }
        #leitorInteragirPopup .lip-btns button {
            width: 100%;
            background: var(--primary, #1a237e);
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 0.4rem 0.7rem;
            font-size: 0.78rem;
            cursor: pointer;
            font-weight: 700;
            font-family: inherit;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            transition: opacity 0.15s;
            box-sizing: border-box;
        }
        #leitorInteragirPopup .lip-btns button:hover { opacity: 0.85; }
        #leitorInteragirPopup .lip-btns button.lip-secundario { background: rgba(0,0,0,0.08); color: #333; }
        #leitorInteragirPopup .lip-btns button.lip-cancelar { background: rgba(0,0,0,0.08); color: #333; }
        .leitor-highlight-ativo { outline: 2px solid #ffe082 !important; outline-offset: 2px !important; }
        body.leitor-tela-ativo { overflow: auto !important; }
        body.leitor-tela-ativo * { cursor: help !important; }
        body.leitor-tela-ativo #leitorTelaPanel,
        body.leitor-tela-ativo #leitorTelaPanel * { cursor: default !important; }
        body.leitor-tela-ativo #leitorInteragirPopup,
        body.leitor-tela-ativo #leitorInteragirPopup * { cursor: pointer !important; }
        #leitorTelaPanel .leitor-ajuda {
            background: rgba(255,255,255,0.2);
            border: none;
            color: #fff;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.15s;
        }
        #leitorTelaPanel .leitor-ajuda:hover { background: rgba(255,255,255,0.35); }
        #leitorAjudaBox {
            display: none;
            font-size: 0.76rem;
            opacity: 0.92;
            line-height: 1.5;
            word-break: break-word;
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid rgba(255,255,255,0.2);
            text-align: justify;
        }
        #leitorAjudaBox.visivel { display: block; }
    `;
    var _styleEl = document.createElement('style');
    _styleEl.textContent = _css;
    document.head.appendChild(_styleEl);

    /* ══════════════════════════════════════════════════
       2. HTML — painel e popup injetados no <body>
    ══════════════════════════════════════════════════ */
    function _injetarHTML() {
        /* Overlay removido — touchstart é passive:true, scroll nunca é bloqueado */

        /* Painel principal */
        var painel = document.createElement('div');
        painel.id = 'leitorTelaPanel';
        painel.setAttribute('role', 'dialog');
        painel.setAttribute('aria-modal', 'true');
        painel.setAttribute('aria-label', 'Leitor de Tela');
        painel.innerHTML =
            '<div class="leitor-header">' +
                '<div class="leitor-titulo">LEITOR DE TELA</div>' +
                '<div style="display:flex;gap:0.3rem;">' +
                    '<button id="leitorBtnAjuda" class="leitor-ajuda" onclick="leitorToggleAjuda()" aria-label="Ajuda do leitor de tela" style="display:none;">?</button>' +
                    '<button class="leitor-fechar" onclick="fecharLeitorTela()" aria-label="Fechar leitor de tela">✕</button>' +
                '</div>' +
            '</div>' +
            '<div class="leitor-instrucao" id="leitorInstrucao"><em>Carregando Leitor...</em></div>' +
            '<div id="leitorAjudaBox"></div>' +
            '<img class="leitor-logo" src="' + _scriptBase + 'bibspeech-logo.png" alt="Logo BibSpeech" aria-hidden="true">' +
            '<div class="leitor-rodape">BibSpeech v' + _VERSION + ' da BibVania</div>';
        document.body.appendChild(painel);

        /* Popup de interação */
        var popup = document.createElement('div');
        popup.id = 'leitorInteragirPopup';
        popup.innerHTML =
            '<div class="lip-texto" id="lipTexto"></div>' +
            '<div class="lip-btns">' +
                '<button id="lipBtnInteragir" onclick="leitorExecutarInteracao()">Interagir</button>' +
                '<button class="lip-secundario" onclick="leitorLerTudo()">Ler Página</button>' +
                '<button id="leitorBtnPausar" class="lip-secundario" onclick="leitorTogglePausa()">Pausar</button>' +
                '<button class="lip-cancelar" onclick="fecharLeitorInteragirPopup()">Cancelar</button>' +
            '</div>';
        document.body.appendChild(popup);
    }

    /* ══════════════════════════════════════════════════
       2b. BOTÃO DE ATIVAÇÃO — vincula ou injeta #leitorTelaBtn
           O HTML não precisa de onclick="abrirLeitorTela()".
           O script assume o controle total do botão.
    ══════════════════════════════════════════════════ */
    function _vincularBotao() {
        var btn = document.getElementById('leitorTelaBtn');

        if (btn) {
            /* Clonar o botão para remover todos os event listeners (inclusive onclick inline
               compilado pelo browser que removeAttribute não cancela em alguns mobile browsers) */
            var clone = btn.cloneNode(true);
            clone.removeAttribute('onclick');
            btn.parentNode.replaceChild(clone, btn);
            clone.addEventListener('click', function () { abrirLeitorTela(); });
            return;
        }

        /* Botão não existe no HTML — injeta automaticamente.
           Tenta inserir na .accessibility-bar ou na toolbar;
           se não encontrar, insere como botão fixo na tela. */
        btn = document.createElement('button');
        btn.id = 'leitorTelaBtn';
        btn.setAttribute('aria-label', 'Ativar leitor de tela');
        btn.setAttribute('oncontextmenu', 'return false');
        btn.innerHTML = '<span class="sr-only">Ativar leitor de tela</span>👁️‍🗨️';
        btn.addEventListener('click', function () { abrirLeitorTela(); });

        var barra = document.querySelector('.accessibility-bar, [role="toolbar"]');
        if (barra) {
            /* Insere no fim da barra */
            barra.appendChild(btn);
            /* Herda a classe visual dos irmãos .control-btn */
            var modelo = barra.querySelector('.control-btn');
            if (modelo) btn.className = modelo.className;
        } else {
            /* Fallback: botão fixo no canto inferior esquerdo */
            btn.style.cssText =
                'position:fixed;bottom:1rem;left:1rem;z-index:99998;' +
                'background:#1a237e;color:#fff;border:none;border-radius:8px;' +
                'padding:0.4rem 0.7rem;font-size:1.2rem;cursor:pointer;' +
                'box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            document.body.appendChild(btn);
        }
    }

    /* ══════════════════════════════════════════════════
       2c. NEUTRALIZAR LISTENERS INLINE DA TOOLBAR
           Botões como #darkModeBtn têm touchend/click registrados
           diretamente no elemento (via _bindAccessBtn ou onclick),
           que executam na target phase DEPOIS do stopImmediatePropagation
           do capture no document — escapando do bloqueio do BibSpeech.
           Solução: clonar e substituir cada botão da toolbar (exceto os
           já gerenciados pelo BibSpeech), limpando todos os
           listeners. O onclick inline é preservado como atributo para
           que o BibSpeech possa acionar via leitorExecutarInteracao().
    ══════════════════════════════════════════════════ */
    function _neutralizarListenersBotoes() {
        var ignorar = { 'leitorTelaBtn': true };
        var barra = document.querySelector('.accessibility-bar, [role="toolbar"]');
        if (!barra) return;

        /* Adiciona listener touchend capture diretamente em cada botão da toolbar.
           Listeners capture no target executam antes dos listeners bubble/target
           registrados sem capture — incluindo os do _bindAccessBtn.
           Isso garante que o BibSpeech intercepta antes de qualquer ação do botão. */
        barra.querySelectorAll('button').forEach(function (btn) {
            if (ignorar[btn.id]) return;

            /* Só o click capture é necessário aqui. O touchend com passive:false
               no nível de cada botão introduz latência perceptível no Android mesmo
               quando retorna imediatamente (leitor inativo) — o browser precisa
               aguardar o JS antes de processar o toque. O handler de touchend no
               document (capture) já cobre o bloqueio quando o leitor está ativo. */
            btn.addEventListener('click', function (e) {
                if (!leitorAtivo) return;
                if (e._leitorInteragir) return;      /* ação do próprio leitor — deixa passar */
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }, true);
        });
    }

    function _inicializar() {
        _injetarHTML();
        _vincularBotao();
        /* Deve rodar após DOMContentLoaded para que _bindAccessBtn já tenha executado */
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _neutralizarListenersBotoes);
        } else {
            _neutralizarListenersBotoes();
        }
    }

    if (document.body) {
        _inicializar();
    } else {
        document.addEventListener('DOMContentLoaded', _inicializar);
    }


    /* ══════════════════════════════════════════════════
       3. ESTADO INTERNO
    ══════════════════════════════════════════════════ */
    var leitorAtivo          = false;
    var leitorPronto         = false;
    var leitorUltimoAlvo     = null;
    var leitorAlvoInteracao  = null;
    var leitorAlvoOriginalClick = null;
    var leitorSintese        = window.speechSynthesis || null;
    var _campoEditavelAtivo  = null; /* campo de texto atualmente com foco */

    /* Exposta para que outros scripts possam checar se o leitor está ativo */
    window.leitorEstaAtivo = function () { return leitorAtivo; };

    /* Navegação por teclado */
    var leitorNavElementos   = [];
    var leitorNavIndice      = -1;
    var leitorPausado        = false;
    var leitorPausaTexto     = null;
    var leitorPausaPalavra   = 0;
    var leitorPausaBoundary  = 0;

    /* ── Persistência entre páginas ─────────────────── */
    var _STORAGE_KEY = 'bibspeech_ativo';

    function _salvarEstado() {
        try { sessionStorage.setItem(_STORAGE_KEY, '1'); } catch(e) {}
    }
    function _limparEstado() {
        try { sessionStorage.removeItem(_STORAGE_KEY); } catch(e) {}
    }
    function _deveReativar() {
        try { return sessionStorage.getItem(_STORAGE_KEY) === '1'; } catch(e) { return false; }
    }

    /* ══════════════════════════════════════════════════
       4. BIBSPEECH.CONF — carregamento e aplicação
    ══════════════════════════════════════════════════ */
    var _bibConf = {
        lang: 'pt-BR',
        pronuncias: {} /* { termo_lowercase: { tipo: 'texto', valor: string } } */
    };

    /* Promise guardada: resolvida quando o .conf terminar de carregar (ou falhar).
       abrirLeitorTela aguarda esta Promise antes de ativar — garante que as
       pronúncias já estão disponíveis no primeiro uso. */
    var _confPronto = (function _carregarConf() {
        var scriptSrc = (document.currentScript && document.currentScript.src) || '';
        var base = scriptSrc ? scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1) : '';
        return fetch(base + 'bibspeech.conf')
            .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
            .then(function (txt) {
                txt.split('\n').forEach(function (linha) {
                    linha = linha.trim();
                    if (!linha || linha.charAt(0) === '#') return;
                    var sep = linha.indexOf('=');
                    if (sep < 0) return;
                    var chave = linha.substring(0, sep).trim().toLowerCase();
                    var valor = linha.substring(sep + 1).trim();
                    if (!chave || !valor) return;

                    if (chave === 'lang') {
                        _bibConf.lang = valor.replace('_', '-');
                        return;
                    }

                    _bibConf.pronuncias[chave] = { tipo: 'texto', valor: valor };
                });
            })
            .catch(function () { /* .conf ausente ou erro — segue com padrões */ });
    })();

    /* Substitui termos no texto usando as pronúncias configuradas (tipo texto).
       Termos mais longos são aplicados primeiro para evitar substituição parcial. */
    function _aplicarPronuncias(txt) {
        if (!txt) return txt;
        var termos = Object.keys(_bibConf.pronuncias)
            .filter(function (t) { return _bibConf.pronuncias[t].tipo === 'texto'; })
            .sort(function (a, b) { return b.length - a.length; });
        termos.forEach(function (termo) {
            try {
                /* Lookbehind/lookahead para não cortar palavras acentuadas */
                var re = new RegExp('(?<![\\wÀ-ÿ])' + termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\wÀ-ÿ])', 'gi');
                txt = txt.replace(re, _bibConf.pronuncias[termo].valor);
            } catch (e) {
                /* Fallback sem lookbehind para browsers antigos */
                var re2 = new RegExp('\\b' + termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
                txt = txt.replace(re2, _bibConf.pronuncias[termo].valor);
            }
        });
        return txt;
    }

    /* ══════════════════════════════════════════════════
       4b. UTILITÁRIOS
    ══════════════════════════════════════════════════ */
    function leitorLimparTexto(txt) {
        return txt
            .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
            .replace(/[\u{2600}-\u{27BF}]/gu, '')
            .replace(/[\u{2300}-\u{23FF}]/gu, '')
            .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/[\u2702-\u27B0]/g, '')
            .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function leitorExtrairTexto(el) {
        /* SELECT direto: lê a opção selecionada (ignora aria-label para não ler o rótulo do campo) */
        if (el.tagName === 'SELECT') {
            var opcaoAtual = el.options[el.selectedIndex] ? leitorLimparTexto(el.options[el.selectedIndex].text) : '';
            return opcaoAtual || 'Elemento sem texto';
        }

        /* Para outros elementos, aria-label / title têm prioridade */
        var al = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title') || '');
        if (al && al.trim()) return leitorLimparTexto(al.trim());

        var img = el.tagName === 'IMG' ? el : (el.querySelector && el.querySelector('img'));
        if (img) {
            var alt = img.getAttribute('alt') || img.getAttribute('title') || '';
            if (alt.trim()) return leitorLimparTexto(alt.trim());
            return 'Imagem sem descricao';
        }

        var txt = (el.innerText || el.textContent || '');
        txt = leitorLimparTexto(txt);
        if (txt.length > 200) txt = txt.substring(0, 200) + '...';
        return txt || 'Elemento sem texto';
    }

    function leitorCriarUtterance(texto) {
        var ut = new SpeechSynthesisUtterance(_aplicarPronuncias(texto));
        ut.lang = _bibConf.lang;
        ut.rate = 1.05;
        return ut;
    }

    function leitorAtualizarStatus(msg) {
        var el = document.getElementById('leitorInstrucao');
        if (el) el.innerHTML = msg;
    }

    /* ══════════════════════════════════════════════════
       5. FALA
    ══════════════════════════════════════════════════ */
    function leitorFalar(texto) {
        leitorPausaBoundary = 0;
        if (!leitorSintese) return;

        var ut = leitorCriarUtterance(texto);
        ut.onboundary = function (e) {
            if (e.name === 'word') {
                leitorPausaBoundary = texto.substring(0, e.charIndex).split(/\s+/).filter(Boolean).length;
            }
        };
        ut.onerror = function () {};

        /* Android Chrome: cancel() seguido de speak() imediato causa delay.
           O setTimeout de 1 frame garante que o engine zerou antes do novo speak. */
        if (leitorSintese.speaking || leitorSintese.pending) {
            leitorSintese.cancel();
            setTimeout(function() { leitorSintese.speak(ut); }, 50);
        } else {
            leitorSintese.speak(ut);
        }
    }

    function _resetarPausa() {
        if (!leitorPausado) return;
        leitorPausado = false;
        leitorPausaTexto = null;
        leitorPausaPalavra = 0;
        leitorPausaBoundary = 0;
        _lerTudoIndice = -1;
        var btn = document.getElementById('leitorBtnPausar');
        if (btn) btn.textContent = 'Pausar';
    }

    function leitorPararFala() {
        _lerTudoIndice = -1;
        leitorPausado = false;
        leitorPausaTexto = null;
        leitorPausaPalavra = 0;
        leitorPausaBoundary = 0;
        var btn = document.getElementById('leitorBtnPausar');
        if (btn) btn.textContent = 'Pausar';
        if (leitorUltimoAlvo) {
            leitorUltimoAlvo.classList.remove('leitor-highlight-ativo');
            leitorUltimoAlvo = null;
        }
        if (leitorSintese) leitorSintese.cancel();
    }




    /* ══════════════════════════════════════════════════
       7. ABRIR / FECHAR
    ══════════════════════════════════════════════════ */
    /* ── Bloqueia/desbloqueia o botão BibSpeech ── */
    function _bloquearAmbos() {
        ['leitorTelaBtn'].forEach(function (id) {
            var b = document.getElementById(id);
            if (!b) return;
            b.disabled = true;
            b.style.opacity = '0.45';
            b.style.cursor = 'default';
            b.style.pointerEvents = 'none';
        });
    }
    function _desbloquearAmbos() {
        ['leitorTelaBtn'].forEach(function (id) {
            var b = document.getElementById(id);
            if (!b) return;
            b.disabled = false;
            b.style.opacity = '';
            b.style.cursor = '';
            b.style.pointerEvents = '';
        });
    }

    window.abrirLeitorTela = function () {
        /* Cria e desbloqueia o AudioContext AQUI, dentro do gesto do usuário (clique),
           para garantir que o browser não bloqueie o áudio — nem na primeira vez.
           Um GainNode com gain=0 é conectado antes do resume para evitar o pop/clique
           que alguns browsers emitem ao inicializar o engine de áudio. */
        var _audioCtx = null;
        try {
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            var _silencio = _audioCtx.createGain();
            _silencio.gain.value = 0;
            _silencio.connect(_audioCtx.destination);
            _audioCtx.resume().catch(function(){});
        } catch(e) { _audioCtx = null; }

        /* Reseta status e botão de ajuda imediatamente, antes do .then(),
           para que o painel nunca mostre o estado anterior ao reabrir. */
        leitorPronto = false;
        leitorAtualizarStatus('<em>Carregando Leitor...</em>');
        var btnAjudaI = document.getElementById('leitorBtnAjuda');
        if (btnAjudaI) btnAjudaI.style.display = 'none';

        /* Aguarda o .conf estar carregado antes de qualquer ação */
        _confPronto.then(function () {
            _abrirLeitorTelaReal(_audioCtx);
        });
    };

    function _abrirLeitorTelaReal(_audioCtx) {
        leitorAtivo = true;
        _salvarEstado();
        document.getElementById('leitorTelaPanel').classList.add('ativo');
        document.body.classList.add('leitor-tela-ativo');

        _bloquearAmbos();

        leitorAtualizarStatus('<em>Carregando Leitor...</em>');

        var _sinteseDisparada = false;
        function _dispararSintese() {
            if (_sinteseDisparada) return;
            _sinteseDisparada = true;
            var ut = leitorCriarUtterance('Leitura de Tela Ativada');
            ut.onend = function () {
                leitorPronto = true;
                var btnAjuda = document.getElementById('leitorBtnAjuda');
                if (btnAjuda) btnAjuda.style.display = '';
                if (leitorAtivo) leitorAtualizarStatus('<em>Ativo.</em>');
            };
            ut.onerror = function () {
                leitorPronto = true;
                var btnAjuda2 = document.getElementById('leitorBtnAjuda');
                if (btnAjuda2) btnAjuda2.style.display = '';
                if (leitorAtivo) leitorAtualizarStatus('<em>Ativo.</em>');
            };
            if (leitorSintese && leitorAtivo) leitorSintese.speak(ut);
            else { leitorPronto = true; var btnAjuda3 = document.getElementById('leitorBtnAjuda'); if (btnAjuda3) btnAjuda3.style.display = ''; leitorAtualizarStatus('<em>Ativo.</em>'); }
        }

        /* Som de notificação estilo Skype (G4 → B4). */
        function _tocarNota(ctx, freq, startTime, duration) {
            var osc  = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            /* Envelope triangular: fade-in 20ms → pico → fade-out até o fim.
               Sem sustain — decai imediatamente após o pico, como o fade-in do início.
               osc.stop tem +0.05s de margem para nunca cortar a onda no meio do ciclo. */
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        }
        function _tocarNotificacao(ctx) {
            /* Usa offset +0.2s para garantir agendamento no futuro mesmo quando
               o contexto acabou de ser criado (currentTime ≈ 0). */
            var t = ctx.currentTime + 0.2;
            _tocarNota(ctx, 392, t,        0.18); /* G4 */
            _tocarNota(ctx, 494, t + 0.22, 0.35); /* B4 — mais longo para o fade-out ter espaço */
            /* Aguarda o fim exato do osc.stop do B4 (t + 0.22 + 0.35 + 0.05)
               mais 300ms de margem, garantindo que o engine terminou de renderizar
               antes de fechar o contexto — evita o pop/ruído no final. */
            var msAteParar = (t + 0.22 + 0.35 + 0.05 - ctx.currentTime) * 1000;
            setTimeout(function() {
                /* Fade-out suave do destino antes de fechar */
                try {
                    var fadeGain = ctx.createGain();
                    fadeGain.connect(ctx.destination);
                    fadeGain.gain.setValueAtTime(1, ctx.currentTime);
                    fadeGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
                } catch(e) {}
                setTimeout(function() { try { ctx.close(); } catch(e){} _dispararSintese(); }, 60);
            }, Math.max(msAteParar, 100) + 300);
        }
        try {
            var _ctx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            _ctx.resume().then(function() {
                _tocarNotificacao(_ctx);
            }).catch(function() { _dispararSintese(); });
        } catch(e) { _dispararSintese(); }
    };

    window.leitorNavResetar = function () {
        leitorNavElementos = [];
        leitorNavIndice = -1;
    };

    window.fecharLeitorTela = function () {
        leitorAtivo = false;
        if (leitorSintese) leitorSintese.cancel();
        leitorPronto = false;
        leitorNavElementos = [];
        leitorNavIndice = -1;
        leitorPausado = false;
        leitorPausaTexto = null;
        _campoEditavelAtivo = null;
        _limparEstado();
        var btnAjudaF = document.getElementById('leitorBtnAjuda');
        if (btnAjudaF) btnAjudaF.style.display = 'none';

        document.getElementById('leitorTelaPanel').classList.remove('ativo');
        document.body.classList.remove('leitor-tela-ativo');

        _desbloquearAmbos();

        fecharLeitorInteragirPopup();
        leitorPararFala();
        if (leitorUltimoAlvo) { leitorUltimoAlvo.classList.remove('leitor-highlight-ativo'); leitorUltimoAlvo = null; }
    };

    /* ── Botão de ajuda ─────────────────────────────── */
    var _ajudaAberta = false;
    var _TEXTO_AJUDA = 'Clique ou use as setas do teclado para navegar. Escolha Interagir, ou Enter, para acionar o botão. Aperte Pausar ou Continuar, ou Espaço, para pausar ou continuar a leitura. Escolha Ler Página, ou L, para ler toda a página a partir de onde parou. Escolha Cancelar, ou Esc, para cancelar a leitura. Aperte Ctrl para abrir ou fechar o Leitor de Tela. Aperte no ponto de interrogação, ou Shift, para abrir ou fechar essa explicação.';

    window.leitorToggleAjuda = function () {
        if (!leitorPronto) return;
        _ajudaAberta = !_ajudaAberta;
        var box = document.getElementById('leitorAjudaBox');
        if (!box) return;
        if (_ajudaAberta) {
            /* Cancela fala anterior e fecha popup de interação */
            leitorPararFala();
            fecharLeitorInteragirPopup && fecharLeitorInteragirPopup();
            box.textContent = _TEXTO_AJUDA;
            box.classList.add('visivel');
            leitorFalar(_TEXTO_AJUDA);
        } else {
            box.classList.remove('visivel');
            leitorPararFala();
        }
    };

    /* ── Botão Pausar/Continuar ──────────────────────── */
    window.leitorTogglePausa = function () {
        if (leitorPausado) {
            leitorRetomar();
        } else {
            leitorPausar();
        }
    };

    /* ── Reativar automaticamente após navegação de página ── */
    (function _reativarSeNecessario() {
        if (!_deveReativar()) return;
        /* Aguarda o DOM estar pronto antes de reativar */
        function _tentar() {
            if (document.getElementById('leitorTelaPanel')) {
                abrirLeitorTela();
            } else {
                setTimeout(_tentar, 100);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _tentar);
        } else {
            _tentar();
        }
    })();

    /* ══════════════════════════════════════════════════
       8. HIGHLIGHT E ALVOS
    ══════════════════════════════════════════════════ */
    function leitorDestacarElemento(el) {
        if (leitorUltimoAlvo && leitorUltimoAlvo !== el) leitorUltimoAlvo.classList.remove('leitor-highlight-ativo');
        /* Sincroniza leitorNavIndice com o elemento destacado */
        if (leitorNavElementos.length) {
            var idx = leitorNavElementos.indexOf(el);
            if (idx >= 0) leitorNavIndice = idx;
        }
        el.classList.add('leitor-highlight-ativo');
        leitorUltimoAlvo = el;
    }

    /* IDs e classes de containers de layout que não devem ser lidos */
    var _CONTAINERS_LAYOUT = ['carrossel-outer', 'carrossel-outer-admin', 'listaLivros',
        'acervo-nav-wrapper', 'acervo-nav-wrapper-admin', 'conteudo-principal'];
    var _CLASSES_LAYOUT = ['container', 'book-item', 'book-header',
        'book-cover-wrap', 'carrossel-nav-lateral'];

    function leitorAlvoSignificativo(el) {
        if (!el || el === document.body || el === document.documentElement) return null;
        if (el.closest && (el.closest('#leitorTelaPanel') || el.closest('#leitorInteragirPopup'))) return null;
        /* Se o clique foi dentro da área da capa, não ler nada */
        if (el.closest && el.closest('.book-cover-wrap')) return null;
        var cur = el;
        for (var i = 0; i < 6; i++) {
            if (!cur || cur === document.body) break;
            /* Para em containers de layout — não sobe mais */
            if (cur.id && _CONTAINERS_LAYOUT.indexOf(cur.id) !== -1) return null;
            if (cur.classList && _CLASSES_LAYOUT.some(function(cls) { return cur.classList.contains(cls); })) return null;
            /* Pula elementos aria-hidden — sobe para o pai */
            if (cur.getAttribute && cur.getAttribute('aria-hidden') === 'true') {
                cur = cur.parentElement;
                continue;
            }
            var txt = leitorExtrairTexto(cur);
            /* Pula elementos cujo texto seja só símbolos não-verbais (ex: ▼ ▲) */
            if (txt && txt !== 'Elemento sem texto' && txt !== 'Imagem sem descricao' &&
                !(/^[\s\W]+$/.test(txt) && !/\w/.test(txt))) return cur;
            cur = cur.parentElement;
        }
        return null;
    }

    function leitorAlvoClicavel(el) {
        var cur = el;
        for (var i = 0; i < 8; i++) {
            if (!cur || cur === document.body) break;
            var tag = cur.tagName;
            if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return cur;
            if (cur.getAttribute && cur.getAttribute('onclick')) return cur;
            if (cur.getAttribute && cur.getAttribute('role') === 'button') return cur;
            cur = cur.parentElement;
        }
        return el;
    }

    /* ══════════════════════════════════════════════════
       9. POPUP DE INTERAÇÃO
    ══════════════════════════════════════════════════ */
    window.fecharLeitorInteragirPopup = function () {
        var popup = document.getElementById('leitorInteragirPopup');
        if (popup) popup.style.display = 'none';
        leitorAlvoInteracao = null;
        leitorPararFala();
        leitorAtualizarStatus('<em>Ativo.</em>');
    };

    var _leitorExecutando = false;

    /* Detecta se o elemento clicado e uma aba/categoria e retorna o nome da aba ativa */
    function _extrairNomeAbaAtiva(el) {
        var isTab = false;
        var role = el.getAttribute && el.getAttribute('role');
        if (role === 'tab') isTab = true;
        if (!isTab && el.dataset && (el.dataset.tab !== undefined || el.dataset.category !== undefined || el.dataset.filter !== undefined)) isTab = true;
        if (!isTab) {
            var cls = (el.className || '') + ' ' + ((el.parentElement && el.parentElement.className) || '');
            if (/\b(tab|categoria|category|filter|filtro|aba)\b/i.test(cls)) isTab = true;
        }
        if (!isTab) return null;
        var parent = el.parentElement;
        if (!parent) return leitorExtrairTexto(el);
        var ativo = parent.querySelector('[aria-selected="true"],[aria-current="page"],[aria-current="true"],.ativo,.active,.selected,.selecionado');
        if (ativo && ativo !== el) return leitorExtrairTexto(ativo);
        return leitorExtrairTexto(el);
    }

    window.leitorExecutarInteracao = function () {
        if (!leitorAlvoInteracao) return;
        var alvo = leitorAlvoInteracao;
        var coords = leitorAlvoOriginalClick || { x: 0, y: 0 };
        leitorAlvoInteracao = null;
        leitorAlvoOriginalClick = null;
        fecharLeitorInteragirPopup();
        _leitorExecutando = true;
        /* Rastreia campo de texto ativo para desinteração automática */
        if (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable) {
            _campoEditavelAtivo = alvo;
        }
        try {
            /* SELECT: showPicker() (Chrome 101+) abre o picker nativo no mobile;
               fallback: focus() que pelo menos posiciona o cursor */
            if (alvo.tagName === 'SELECT') {
                alvo.focus();
                try {
                    if (typeof alvo.showPicker === 'function') {
                        alvo.showPicker();
                    } else {
                        var cl = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: coords.x, clientY: coords.y });
                        cl._leitorInteragir = true;
                        alvo.dispatchEvent(cl);
                    }
                } catch (ex) {
                    var cl2 = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: coords.x, clientY: coords.y });
                    cl2._leitorInteragir = true;
                    alvo.dispatchEvent(cl2);
                }
            } else {
                alvo.focus();
                var evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: coords.x, clientY: coords.y });
                evt._leitorInteragir = true;
                alvo.dispatchEvent(evt);
            }
        } finally {
            _leitorExecutando = false;
        }

        /* Para SELECT: lê a nova opção SOMENTE se o valor mudou (evita leitura dupla) */
        if (alvo.tagName === 'SELECT') {
            var _idxAntes = alvo.selectedIndex;
            setTimeout(function () {
                if (!leitorAtivo) return;
                if (alvo.selectedIndex !== _idxAntes && alvo.options[alvo.selectedIndex]) {
                    leitorFalar(leitorLimparTexto(alvo.options[alvo.selectedIndex].text));
                }
            }, 300);
        }
    };

    /* ══════════════════════════════════════════════════
       10. EVENTOS: FOCO, CLIQUE, TECLADO
    ══════════════════════════════════════════════════ */
    /* Bloqueia mousedown durante carregamento (antes de leitorPronto):
       impede que o browser dê foco e ative elementos enquanto o leitor
       ainda está inicializando. Fora do carregamento, deixa passar para
       que o focusin e o click processem normalmente. */
    document.addEventListener('mousedown', function (e) {
        if (!leitorAtivo || leitorPronto) return;
        if (e.target.closest && (e.target.closest('#leitorTelaPanel') || e.target.closest('#leitorInteragirPopup'))) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }, true);

    document.addEventListener('focusin', function (e) {
        if (!leitorAtivo) return;
        if (!leitorPronto) return;           /* ignora foco durante carregamento */
        if (_leitorExecutando) return;
        if (e.target.closest && (e.target.closest('#leitorTelaPanel') || e.target.closest('#leitorInteragirPopup'))) return;
        var alvo = leitorAlvoSignificativo(e.target) || e.target;
        leitorDestacarElemento(alvo);
        leitorFalar(leitorExtrairTexto(alvo));
    }, true);

    /* No mobile o browser gera click sintético após touchend.
       Rastreamos o movimento para distinguir scroll de toque intencional.
       Guardamos as coordenadas do toque para usar no popup. */
    var _touchCoords   = null;
    var _touchStartY   = null;
    var _touchIsScroll = false;

    document.addEventListener('touchstart', function (e) {
        if (!leitorAtivo) return;
        if (_leitorExecutando) return;
        if (e.target.closest && (e.target.closest('#leitorTelaPanel') || e.target.closest('#leitorInteragirPopup'))) return;
        var t = e.touches[0];
        _touchCoords   = t ? { x: t.clientX, y: t.clientY } : null;
        _touchStartY   = t ? t.clientY : null;
        _touchIsScroll = false;
        /* NÃO chama preventDefault() aqui — aguarda touchmove para decidir */
    }, { capture: true, passive: true });

    document.addEventListener('touchmove', function (e) {
        if (!leitorAtivo) return;
        if (_touchStartY === null) return;
        var t = e.touches[0];
        if (!t) return;
        var dy = Math.abs(t.clientY - _touchStartY);
        var dx = Math.abs(t.clientX - (_touchCoords ? _touchCoords.x : t.clientX));
        if (dy > 8 && dy > dx) _touchIsScroll = true;
    }, { capture: true, passive: true });

    document.addEventListener('touchend', function (e) {
        if (!leitorAtivo) return;
        if (_leitorExecutando) return;
        if (e.target.closest && (e.target.closest('#leitorTelaPanel') || e.target.closest('#leitorInteragirPopup'))) return;
        if (_touchIsScroll) { _touchCoords = null; _touchStartY = null; _touchIsScroll = false; return; }
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!leitorPronto) { _touchCoords = null; _touchStartY = null; return; }

        /* Trata o touchend como um clique do leitor */
        var coords = _touchCoords || { x: 0, y: 0 };
        _touchCoords = null; _touchStartY = null;
        _processarClique(e.target, coords.x, coords.y);
    }, { capture: true, passive: false });

    /* Bloqueia click no desktop (e click sintético que escapar do touchstart) */
    document.addEventListener('click', function (e) {
        if (!leitorAtivo) return;
        if (_leitorExecutando) return;
        if (e.target.closest && (e.target.closest('#leitorTelaPanel') || e.target.closest('#leitorInteragirPopup'))) return;
        if (e._leitorInteragir) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!leitorPronto) return;
        _processarClique(e.target, e.clientX, e.clientY);
    }, true);

    function _processarClique(target, cx, cy) {
        _resetarPausa();
        /* Se havia um campo de texto ativo e o clique é em outro elemento, desativa */
        if (_campoEditavelAtivo && _campoEditavelAtivo !== target && !_campoEditavelAtivo.contains(target)) {
            _campoEditavelAtivo.blur();
            _campoEditavelAtivo = null;
        }
        /* Ignora clique no botão de ativar leitor quando já está ativo */
        if (target && (target.id === 'leitorTelaBtn' || target.closest && target.closest('#leitorTelaBtn'))) return;
        /* Se ajuda estava aberta e o clique não é no botão "?", fecha a ajuda */
        if (_ajudaAberta && target && !(target.closest && target.closest('.leitor-ajuda'))) {
            _ajudaAberta = false;
            var _box = document.getElementById('leitorAjudaBox');
            if (_box) _box.classList.remove('visivel');
            leitorPararFala();
        }
        var alvoTexto = leitorAlvoSignificativo(target);
        if (!alvoTexto) return;
        var alvoAcao  = leitorAlvoClicavel(target);
        if (!alvoAcao) return;

        leitorAlvoInteracao = alvoAcao;
        leitorAlvoOriginalClick = { x: cx, y: cy };

        var txt = leitorExtrairTexto(alvoTexto);
        leitorFalar(txt);
        leitorDestacarElemento(alvoTexto);

        var popup = document.getElementById('leitorInteragirPopup');
        document.getElementById('lipTexto').textContent = txt.substring(0, 80) + (txt.length > 80 ? '...' : '');
        popup.style.display = 'block';
        popup.style.left = '0px'; popup.style.top = '0px';
        var pw = popup.offsetWidth || 180, ph = popup.offsetHeight || 80;
        popup.style.left = Math.min(cx + 10, window.innerWidth  - pw - 12) + 'px';
        popup.style.top  = Math.min(cy + 10, window.innerHeight - ph - 12) + 'px';
        leitorAtualizarStatus('<em>Ativo.</em>');
    }

    /* ── Teclado ──────────────────────────────────── */
    function leitorNavColetar() {
        /* Landmarks (header/main/nav/footer com aria-label) entram na lista
           independentemente do filtro de ancestrais — são lidos como marco
           estrutural antes dos seus filhos. */
        var _LANDMARKS = 'header[aria-label],main[aria-label],nav[aria-label],footer[aria-label],[role="group"][aria-label]';
        var landmarks = Array.from(document.querySelectorAll(_LANDMARKS));

        var todos = Array.from(document.querySelectorAll('button,a,input,select,textarea,h1,h2,h3,h4,h5,h6,p,li,[role=button],[aria-label]'));
        /* Filtra elementos invisíveis, do painel, aria-hidden e texto não-verbal */
        var candidatos = todos.filter(function (el) {
            if (el.closest('#leitorTelaPanel') || el.closest('#leitorInteragirPopup')) return false;
            if (el.offsetParent === null && el.tagName !== 'BODY') return false;
            if (el.getAttribute('aria-hidden') === 'true') return false;
            if (el.closest('[aria-hidden="true"]')) return false;
            var txt = leitorExtrairTexto(el);
            if (!txt || txt === 'Elemento sem texto' || txt === 'Imagem sem descricao') return false;
            /* Ignora elementos cujo texto seja só símbolos/emojis sem conteúdo verbal */
            if (/^[\s\W]+$/.test(txt) && !/\w/.test(txt)) return false;
            return true;
        });
        /* Remove elementos que são ancestrais de outro elemento na lista
           (evita ler o card pai E seus filhos separadamente).
           Regras:
           - Landmarks estruturais (header, etc.) são preservados; seus filhos também.
           - Grupos (role=group[aria-label]) são preservados; seus filhos são EXCLUÍDOS
             — o grupo é lido como unidade.
           - Demais ancestrais são removidos normalmente. */
        var semAncestral = candidatos.filter(function (el) {
            /* Filho de um role=group[aria-label]? Excluir — o grupo fala por ele. */
            var grupoAncestral = el.closest('[role="group"][aria-label]');
            if (grupoAncestral && grupoAncestral !== el) return false;
            /* Landmark estrutural: sempre preservar */
            if (landmarks.indexOf(el) !== -1) return true;
            /* Ancestral de outro candidato (não-grupo): remover */
            return !candidatos.some(function (outro) {
                return outro !== el && el.contains(outro);
            });
        });
        /* Ordena pela posição no DOM para garantir que landmarks aparecem
           antes dos seus filhos na navegação sequencial. */
        leitorNavElementos = semAncestral.sort(function (a, b) {
            var pos = a.compareDocumentPosition(b);
            return (pos & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
        });
    }

    function leitorNavIrPara(idx) {
        _resetarPausa();
        if (!leitorNavElementos.length) leitorNavColetar();
        if (!leitorNavElementos.length) return;
        leitorNavIndice = ((idx % leitorNavElementos.length) + leitorNavElementos.length) % leitorNavElementos.length;
        var el = leitorNavElementos[leitorNavIndice];
        leitorDestacarElemento(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        leitorPausado = false; leitorPausaTexto = null;
        leitorFalar(leitorExtrairTexto(el));
    }

    function leitorPausar() {
        if (!leitorSintese || !leitorSintese.speaking || leitorPausado) return;
        /* Texto atual: elemento navegado OU último elemento destacado por clique */
        var elAtual = leitorNavElementos[leitorNavIndice] || leitorUltimoAlvo;
        leitorPausaTexto = elAtual ? leitorExtrairTexto(elAtual) : null;
        leitorPausaPalavra = leitorPausaBoundary || 0;
        leitorSintese.cancel();
        leitorPausado = true;
        leitorAtualizarStatus('<em>Pausado.</em>');
        var btn = document.getElementById('leitorBtnPausar');
        if (btn) btn.textContent = 'Continuar';
    }

    function leitorRetomar() {
        if (!leitorPausado) return;
        leitorPausado = false;
        leitorAtualizarStatus('<em>Ativo.</em>');
        var btn = document.getElementById('leitorBtnPausar');
        if (btn) btn.textContent = 'Pausar';
        /* Modo "Ler Página": retoma do elemento atual */
        if (_lerTudoIndice >= 0) {
            /* _lerTudoIndice já aponta para o próximo (foi incrementado antes do speak),
               então recua 1 para reler o elemento que foi interrompido */
            if (_lerTudoIndice > 0) _lerTudoIndice--;
            leitorPausaTexto = null; leitorPausaPalavra = 0; leitorPausaBoundary = 0;
            _lerTudoProximo();
            return;
        }
        /* Modo leitura simples: retoma de onde parou na palavra */
        if (!leitorPausaTexto) return;
        var restante = leitorPausaTexto.split(/\s+/).slice(leitorPausaPalavra).join(' ');
        leitorPausaTexto = null; leitorPausaPalavra = 0; leitorPausaBoundary = 0;
        leitorFalar(restante || ' ');
    }

    var _lerTudoIndice = -1;

    window.leitorLerTudo = function leitorLerTudo() {
        leitorNavColetar(); /* sempre recoletar para refletir DOM atual */
        /* Determina elemento de início a partir do elemento destacado */
        var inicio = 0;
        var ref = leitorUltimoAlvo;
        if (ref) {
            /* busca exata */
            var idxExato = leitorNavElementos.indexOf(ref);
            if (idxExato >= 0) {
                inicio = idxExato;
            } else {
                /* busca por containment: ref é filho de algum nav element, ou nav element é filho de ref */
                var melhor = -1;
                for (var j = 0; j < leitorNavElementos.length; j++) {
                    if (ref.contains(leitorNavElementos[j]) || leitorNavElementos[j].contains(ref)) {
                        melhor = j; break;
                    }
                }
                if (melhor >= 0) inicio = melhor;
                else if (leitorNavIndice >= 0) inicio = leitorNavIndice;
            }
        } else if (leitorNavIndice >= 0) {
            inicio = leitorNavIndice;
        }
        leitorPararFala(); /* cancela fala anterior e zera _lerTudoIndice */
        leitorPausado = false;
        leitorPausaTexto = null;
        _lerTudoIndice = inicio;
        _lerTudoProximo();
    };

    function _lerTudoProximo() {
        if (!leitorAtivo || leitorPausado) return;
        if (_lerTudoIndice >= leitorNavElementos.length) { _lerTudoIndice = -1; return; }
        var el = leitorNavElementos[_lerTudoIndice];
        var txt = leitorExtrairTexto(el);
        leitorNavIndice = _lerTudoIndice;
        leitorDestacarElemento(el);
        _lerTudoIndice++;
        if (!txt || txt === 'Elemento sem texto') { _lerTudoProximo(); return; }
        var ut = leitorCriarUtterance(txt);
        ut.onend = function () { if (leitorAtivo && !leitorPausado) _lerTudoProximo(); };
        ut.onerror = function () { if (leitorAtivo && !leitorPausado) _lerTudoProximo(); };
        leitorSintese.cancel();
        leitorSintese.speak(ut);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Control' && !e.shiftKey && !e.altKey) {
            e.preventDefault();
            if (!leitorAtivo) { abrirLeitorTela(); } else { fecharLeitorTela(); }
            return;
        }
        if (!leitorAtivo || !leitorPronto) return;
        switch (e.key) {
            case 'ArrowDown': case 'ArrowRight':
                e.preventDefault();
                if (!leitorNavElementos.length) leitorNavColetar();
                leitorNavIrPara(leitorNavIndice + 1); break;
            case 'ArrowUp': case 'ArrowLeft':
                e.preventDefault();
                if (!leitorNavElementos.length) leitorNavColetar();
                leitorNavIrPara(leitorNavIndice - 1); break;
            case 'Enter':
                e.preventDefault();
                if (leitorNavIndice >= 0 && leitorNavElementos[leitorNavIndice]) {
                    leitorAlvoInteracao = leitorAlvoClicavel(leitorNavElementos[leitorNavIndice]) || leitorNavElementos[leitorNavIndice];
                    leitorExecutarInteracao();
                } break;
            case ' ':
                e.preventDefault();
                if (leitorPausado) { leitorRetomar(); } else { leitorPausar(); } break;
            case 'Shift':
                e.preventDefault();
                leitorToggleAjuda(); break;
            case 'l': case 'L':
                e.preventDefault();
                leitorLerTudo(); break;
            case 'Escape':
                e.preventDefault();
                leitorPararFala();
                leitorPausado = false; leitorPausaTexto = null;
                leitorAtualizarStatus('<em>Ativo.</em>'); break;
        }
    }, true);

})();
