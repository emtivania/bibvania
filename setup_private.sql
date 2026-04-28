-- ============================================================================
-- BibVania — setup_private.sql
-- Configuração PRIVADA — Chaves de API
-- ============================================================================
--
-- ⚠️  ATENÇÃO: ESTE ARQUIVO CONTÉM SEGREDOS DE API.
--    NUNCA faça commit deste arquivo para um repositório público no GitHub.
--    Adicione "setup_private.sql" ao seu .gitignore.
--
-- PROPÓSITO
--   Insere as chaves de API necessárias para as funcionalidades avançadas:
--   • imgbb_api_key  — upload de capas de livros via ImgBB
--   • groq_api_key   — análise de imagens com IA (Llama 4 Scout via Groq)
--   Ambas as chaves são lidas da tabela config_privada pelo admin.html após login
--   (via RLS autenticada), mantendo-as fora do código-fonte do frontend.
--
-- PRÉ-REQUISITO
--   Execute supabase_setup.sql ANTES deste arquivo.
--   A tabela config_privada deve existir.
--
-- COMO OBTER AS CHAVES
--   imgbb_api_key: https://api.imgbb.com (conta gratuita)
--   groq_api_key:  https://console.groq.com/keys (conta gratuita)
--
-- COMO EXECUTAR
--   1. Substitua os valores <<SUA_CHAVE_AQUI>> abaixo pelas chaves reais
--   2. Acesse Dashboard Supabase → SQL Editor → New query
--   3. Cole e clique em Run
--   4. Apague o arquivo ou remova as chaves após executar
--
-- ============================================================================

-- ============================================================================
-- BIBVANIA ONLINE — CONFIGURAÇÃO PRIVADA v1.3
-- Chaves de API: Groq AI e ImgBB
--
-- ⚠️  ESTE ARQUIVO CONTÉM SEGREDOS. NUNCA suba para o GitHub.
--
-- PRÉ-REQUISITO: execute supabase_setup.sql antes deste arquivo.
--
-- COMO EXECUTAR:
--   1. Acesse o Dashboard do Supabase → SQL Editor
--   2. Cole o conteúdo deste arquivo
--   3. Substitua os dois valores marcados com <<SUA_CHAVE_AQUI>>
--   4. Clique em Run
-- ============================================================================


-- ── ONDE OBTER AS CHAVES ────────────────────────────────────────────────────
--
-- GROQ AI (catalogação automática de livros por IA)
--   • Acesse: https://console.groq.com/keys
--   • Crie uma conta gratuita → "Create API Key"
--   • Copie a chave (começa com "gsk_...")
--
-- IMGBB (armazenamento de capas de livros)
--   • Acesse: https://api.imgbb.com
--   • Faça login → clique em "Get API key"
--   • Copie a chave (string hexadecimal)
--
-- ────────────────────────────────────────────────────────────────────────────


-- ============================================================================
-- INSERÇÃO DAS CHAVES
-- ON CONFLICT garante que re-executar este script apenas atualiza os valores,
-- sem criar duplicatas nem gerar erros.
-- ============================================================================

INSERT INTO config_privada (chave, valor)
VALUES ('groq_api_key', '<<SUA_CHAVE_GROQ_AQUI>>')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

INSERT INTO config_privada (chave, valor)
VALUES ('imgbb_api_key', '<<SUA_CHAVE_IMGBB_AQUI>>')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;


-- ============================================================================
-- VERIFICAÇÃO (opcional)
-- Execute após inserir para confirmar que as chaves foram salvas corretamente.
-- Os valores aparecem mascarados para evitar exposição no histórico do editor.
-- ============================================================================

SELECT
    chave,
    LEFT(valor, 6) || REPEAT('*', GREATEST(LENGTH(valor) - 10, 4)) || RIGHT(valor, 4) AS valor_mascarado,
    CASE WHEN LENGTH(valor) > 8 THEN '✅ OK' ELSE '⚠️ MUITO CURTA — VERIFIQUE' END AS status
FROM config_privada
WHERE chave IN ('groq_api_key', 'imgbb_api_key')
ORDER BY chave;
