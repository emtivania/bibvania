-- ============================================================================
-- BibVania — supabase_setup.sql
-- Configuração pública do banco de dados Supabase
-- ============================================================================
--
-- PROPÓSITO
--   Cria toda a estrutura de banco necessária para o BibVania:
--   tabelas, tipos, funções, políticas RLS e triggers.
--   Este arquivo é SEGURO para commitar no GitHub (não contém segredos).
--
-- PRÉ-REQUISITO
--   Execute este arquivo ANTES de setup_private.sql.
--
-- COMO EXECUTAR
--   1. Acesse o Dashboard do Supabase → SQL Editor → New query
--   2. Cole o conteúdo e clique em Run
--
-- TABELAS CRIADAS
--   livros          — Acervo bibliográfico (título, autor, ISBN, categoria,
--                     quantidade_total, quantidade_disponivel, imagem_url,
--                     pdf_url, palavras_chave, alt_text, data_cadastro,
--                     data_edicao)
--   emprestimos     — Registro de empréstimos e devoluções (livro_id,
--                     pessoa_id, nome_aluno, sexo, ano_aluno, turma_aluno,
--                     status, data_emprestimo, data_prevista_devolucao,
--                     data_devolucao, dias_emprestimo, sem_data_definida)
--   pessoas         — Cadastro de alunos e funcionários (nome, sexo,
--                     tipo, ano_aluno, turma_aluno, pcd, data_cadastro)
--   admins          — Perfil do bibliotecário autenticado (id → auth.users,
--                     nome, foto_url)
--   config_privada  — Chaves de API (groq_api_key, imgbb_api_key)
--                     com RLS: somente usuários autenticados leem
--   reservas        — Reservas de livros feitas pelo index público
--                     (livro_id, pessoa_id, nome_pessoa, sexo, ano_aluno,
--                     turma_aluno, tipo, data_reserva, status)
--
-- SEGURANÇA (RLS)
--   • livros, emprestimos, pessoas: leitura pública; escrita autenticada
--   • admins: leitura e escrita apenas pelo próprio usuário autenticado
--   • config_privada: somente autenticados leem
--
-- TRIGGERS / FUNÇÕES
--   • atualizar_quantidade_disponivel(): recalcula quantidade_disponivel
--     nos livros após INSERT/UPDATE/DELETE em emprestimos
--   • recalcular_disponivel(): única função de trigger existente
--
-- ============================================================================


-- 0. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS unaccent; -- busca sem acento (usada no script de limpeza)

-- 1. TABELA DE LIVROS
CREATE TABLE IF NOT EXISTS livros (
    id BIGINT PRIMARY KEY,
    isbn TEXT,
    imagem_url TEXT,
    pdf_url TEXT,
    titulo TEXT NOT NULL,
    autor TEXT,
    categoria TEXT,
    prateleira TEXT,
    palavras_chave TEXT[] DEFAULT '{}',
    alt_text TEXT,
    quantidade_total INTEGER NOT NULL DEFAULT 1,
    quantidade_disponivel INTEGER NOT NULL DEFAULT 1,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_edicao TIMESTAMP WITH TIME ZONE
);

-- 2. TABELA DE EMPRÉSTIMOS
-- Nota: pessoa_id é adicionado via ALTER TABLE na seção 14,
-- após a criação da tabela pessoas.
CREATE TABLE IF NOT EXISTS emprestimos (
    id BIGSERIAL PRIMARY KEY,
    livro_id BIGINT REFERENCES livros(id) ON DELETE CASCADE,
    nome_aluno TEXT NOT NULL,
    sexo CHAR(1),
    ano_aluno INTEGER,
    turma_aluno TEXT,
    data_emprestimo TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_prevista_devolucao TIMESTAMP WITH TIME ZONE,
    data_devolucao TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'emprestado' CHECK (status IN ('emprestado', 'devolvido')),
    dias_emprestimo INTEGER,
    sem_data_definida BOOLEAN DEFAULT FALSE
);

-- 3. TABELA DE HISTÓRICO DE EXCLUSÃO
CREATE TABLE IF NOT EXISTS livros_excluidos (
    id BIGSERIAL PRIMARY KEY,
    livro_id BIGINT,
    titulo TEXT,
    autor TEXT,
    isbn TEXT,
    data_exclusao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SEGURANÇA (RLS)
ALTER TABLE livros ENABLE ROW LEVEL SECURITY;
ALTER TABLE emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE livros_excluidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura autenticada de livros_excluidos" ON livros_excluidos;
DROP POLICY IF EXISTS "Escrita autenticada de livros_excluidos" ON livros_excluidos;
CREATE POLICY "Leitura autenticada de livros_excluidos" ON livros_excluidos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Escrita autenticada de livros_excluidos" ON livros_excluidos FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Leitura pública de livros" ON livros;
DROP POLICY IF EXISTS "Escrita autenticada de livros" ON livros;
CREATE POLICY "Leitura pública de livros" ON livros FOR SELECT USING (true);
CREATE POLICY "Escrita autenticada de livros" ON livros FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Leitura pública de emprestimos" ON emprestimos;
DROP POLICY IF EXISTS "Escrita autenticada de emprestimos" ON emprestimos;
CREATE POLICY "Leitura pública de emprestimos" ON emprestimos FOR SELECT USING (true);
CREATE POLICY "Escrita autenticada de emprestimos" ON emprestimos FOR ALL USING (auth.role() = 'authenticated');

-- 5. TRIGGER DE DISPONIBILIDADE
-- Recalcula quantidade_disponivel automaticamente a cada mudança nos empréstimos.
CREATE OR REPLACE FUNCTION recalcular_disponivel()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE livros SET quantidade_disponivel = quantidade_total - (
            SELECT COUNT(*) FROM emprestimos
            WHERE livro_id = OLD.livro_id AND status = 'emprestado'
        ) WHERE id = OLD.livro_id;
        RETURN OLD;
    ELSE
        UPDATE livros SET quantidade_disponivel = quantidade_total - (
            SELECT COUNT(*) FROM emprestimos
            WHERE livro_id = NEW.livro_id AND status = 'emprestado'
        ) WHERE id = NEW.livro_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_atualizar_disponivel ON emprestimos;
CREATE TRIGGER trigger_atualizar_disponivel
AFTER INSERT OR UPDATE OR DELETE ON emprestimos
FOR EACH ROW EXECUTE FUNCTION recalcular_disponivel();

-- 6. COLUNAS ADICIONAIS (migração para bancos instalados antes desta versão)
-- Todas estas colunas já estão no CREATE TABLE acima (seção 1).
-- Os ALTER TABLE abaixo são mantidos apenas para instalações existentes que
-- ainda não possuem essas colunas. Em bancos novos, IF NOT EXISTS os ignora.
ALTER TABLE livros ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE livros ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE livros ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE livros ADD COLUMN IF NOT EXISTS prateleira TEXT;
ALTER TABLE livros ADD COLUMN IF NOT EXISTS data_edicao TIMESTAMP WITH TIME ZONE;

-- 7. TABELA DE PESSOAS (alunos e funcionários)
CREATE TABLE IF NOT EXISTS pessoas (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    sexo CHAR(1) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aluno', 'funcionario')),
    ano_aluno INTEGER,
    turma_aluno TEXT,
    pcd BOOLEAN DEFAULT FALSE,
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
-- pcd já definido na criação da tabela acima; ADD COLUMN IF NOT EXISTS para bancos existentes:
ALTER TABLE pessoas ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT FALSE;
DROP POLICY IF EXISTS "Leitura pública de pessoas" ON pessoas;
DROP POLICY IF EXISTS "Escrita autenticada de pessoas" ON pessoas;
CREATE POLICY "Leitura pública de pessoas" ON pessoas FOR SELECT USING (true);
CREATE POLICY "Escrita autenticada de pessoas" ON pessoas FOR ALL USING (auth.role() = 'authenticated');

-- 8. REALTIME
-- Habilita atualizações em tempo real para livros, emprestimos e pessoas.
-- Reservas tem seu próprio bloco Realtime na seção 13.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'livros'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE livros;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'emprestimos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE emprestimos;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'pessoas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE pessoas;
    END IF;
END $$;

-- 9. VERIFICAR REALTIME ATIVO
-- Execute para confirmar que as 3 tabelas estão com Realtime habilitado:
-- SELECT schemaname, tablename
-- FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
-- ORDER BY tablename;

-- ============================================================================
-- 10. CONFIGURAÇÕES PRIVADAS (chaves de API)
-- Acessível apenas por usuários autenticados (admin).
-- ATENÇÃO: Execute setup_private.sql separadamente para inserir
-- as chaves reais. Esse arquivo NÃO vai para o GitHub.
-- ============================================================================

CREATE TABLE IF NOT EXISTS config_privada (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

ALTER TABLE config_privada ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Somente autenticados leem config_privada" ON config_privada;
CREATE POLICY "Somente autenticados leem config_privada"
    ON config_privada
    FOR SELECT
    TO authenticated
    USING (true);

-- Ninguém (nem autenticado) pode inserir/alterar/deletar via API
-- Só você pelo Dashboard do Supabase

-- ============================================================================
-- 11. TABELA DE ADMINS SECUNDÁRIOS
-- Vincula UUID do Supabase Auth ao nome e foto de perfil do admin.
-- Os dados (UUID + nome) são inseridos manualmente no SQL Editor após criar
-- o usuário em Authentication > Users no Dashboard do Supabase.
-- ============================================================================

CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT NOT NULL,
    foto_url TEXT
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin lê próprio perfil" ON admins;
CREATE POLICY "Admin lê próprio perfil"
    ON admins FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin atualiza própria foto" ON admins;
CREATE POLICY "Admin atualiza própria foto"
    ON admins FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Para inserir um novo admin secundário após criar o usuário no Auth:
-- INSERT INTO admins (id, nome) VALUES ('uuid-do-usuario', 'Nome do Admin');

-- ============================================================================
-- 12. BIBFILES — TABELAS DE CHAVES ECDSA E METADADOS DE PDFs
-- Usadas pelo bibfiles.html para armazenamento seguro de chaves de assinatura
-- digital e metadados dos PDFs guardados no Internet Archive.
-- ============================================================================

-- Chaves ECDSA por usuário (uma linha por admin)
CREATE TABLE IF NOT EXISTS bibfiles_chaves (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    priv_key_enc TEXT NOT NULL,  -- chave privada PKCS8 base64, criptografada AES-256
    pub_key TEXT NOT NULL,       -- chave pública SPKI base64 (não criptografada)
    username TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bibfiles_chaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário lê próprias chaves" ON bibfiles_chaves;
CREATE POLICY "Usuário lê próprias chaves"
    ON bibfiles_chaves FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere próprias chaves" ON bibfiles_chaves;
CREATE POLICY "Usuário insere próprias chaves"
    ON bibfiles_chaves FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza próprias chaves" ON bibfiles_chaves;
CREATE POLICY "Usuário atualiza próprias chaves"
    ON bibfiles_chaves FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário deleta próprias chaves" ON bibfiles_chaves;
CREATE POLICY "Usuário deleta próprias chaves"
    ON bibfiles_chaves FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Metadados dos PDFs guardados no Internet Archive
CREATE TABLE IF NOT EXISTS bibfiles_pdfs (
    id TEXT PRIMARY KEY,                -- uid gerado no cliente (timestamp + random)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,                 -- nome original do arquivo
    tamanho BIGINT NOT NULL,            -- tamanho em bytes do PDF assinado
    data TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    hash TEXT NOT NULL,                 -- SHA-256 do PDF assinado
    publico BOOLEAN DEFAULT FALSE,
    ia_identifier TEXT NOT NULL,        -- identifier do item no Internet Archive
    ia_filename TEXT NOT NULL,          -- nome do arquivo dentro do item IA
    ia_url TEXT,                        -- URL pública (só para PDFs públicos)
    iv_enc TEXT,                        -- IV de criptografia AES-256 (só para privados)
    ia_pronto BOOLEAN DEFAULT TRUE,     -- FALSE enquanto o IA ainda está processando o arquivo
    assinante TEXT,                      -- nome do assinante (ex: ruan_bibvania)
    assinatura TEXT,                     -- assinatura ECDSA P-384 em base64
    assinatura_pub TEXT,                 -- chave pública do assinante em base64
    assinatura_data TEXT,                -- data/hora ISO da assinatura
    assinatura_hash TEXT                 -- hash SHA-384 do arquivo original em base64
);

-- Migração: adicionar colunas em instalações existentes
ALTER TABLE bibfiles_pdfs ADD COLUMN IF NOT EXISTS ia_pronto BOOLEAN DEFAULT TRUE;
ALTER TABLE bibfiles_pdfs ADD COLUMN IF NOT EXISTS assinante TEXT;
ALTER TABLE bibfiles_pdfs ADD COLUMN IF NOT EXISTS assinatura TEXT;
ALTER TABLE bibfiles_pdfs ADD COLUMN IF NOT EXISTS assinatura_pub TEXT;
ALTER TABLE bibfiles_pdfs ADD COLUMN IF NOT EXISTS assinatura_data TEXT;
ALTER TABLE bibfiles_pdfs ADD COLUMN IF NOT EXISTS assinatura_hash TEXT;

ALTER TABLE bibfiles_pdfs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário lê próprios PDFs" ON bibfiles_pdfs;
CREATE POLICY "Usuário lê próprios PDFs"
    ON bibfiles_pdfs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Permite verificação pública de assinatura (qualquer pessoa pode verificar pelo hash).
-- ⚠️  ATENÇÃO: esta policy expõe TODAS as colunas da linha (incluindo iv_enc e ia_*)
-- para usuários não autenticados. O cliente só consulta colunas de assinatura,
-- mas a RLS não restringe colunas. Se desejar limitar, use uma VIEW ou função SECURITY DEFINER.
DROP POLICY IF EXISTS "Verificação pública de assinatura" ON bibfiles_pdfs;
CREATE POLICY "Verificação pública de assinatura"
    ON bibfiles_pdfs FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Usuário insere próprios PDFs" ON bibfiles_pdfs;
CREATE POLICY "Usuário insere próprios PDFs"
    ON bibfiles_pdfs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário deleta próprios PDFs" ON bibfiles_pdfs;
CREATE POLICY "Usuário deleta próprios PDFs"
    ON bibfiles_pdfs FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza próprios PDFs" ON bibfiles_pdfs;
CREATE POLICY "Usuário atualiza próprios PDFs"
    ON bibfiles_pdfs FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 13. TABELA DE RESERVAS
-- Permite que alunos e funcionários reservem livros pelo index público.
-- A reserva é concluída pelo admin na aba Reservas, gerando um empréstimo.
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservas (
    id              BIGSERIAL PRIMARY KEY,
    livro_id        BIGINT NOT NULL REFERENCES livros(id) ON DELETE CASCADE,
    pessoa_id       BIGINT REFERENCES pessoas(id) ON DELETE CASCADE,
    nome_pessoa     TEXT NOT NULL,
    sexo            CHAR(1),
    ano_aluno       INTEGER,
    turma_aluno     TEXT,
    tipo            TEXT NOT NULL CHECK (tipo IN ('aluno', 'funcionario')),
    data_reserva    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status          TEXT NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'concluida', 'cancelada'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reservas_livro   ON reservas(livro_id);
CREATE INDEX IF NOT EXISTS idx_reservas_pessoa  ON reservas(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_reservas_status  ON reservas(status);
-- idx_reservas_nome mantido para buscas de texto no admin
CREATE INDEX IF NOT EXISTS idx_reservas_nome    ON reservas(nome_pessoa);

-- RLS
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Limpar TODAS as policies antigas (incluindo nomes em snake_case de migrações anteriores)
DROP POLICY IF EXISTS "Leitura pública de reservas"      ON reservas;
DROP POLICY IF EXISTS "Inserção pública de reservas"     ON reservas;
DROP POLICY IF EXISTS "Escrita autenticada de reservas"  ON reservas;
DROP POLICY IF EXISTS "Exclusão pública de reservas"     ON reservas;
DROP POLICY IF EXISTS "Atualização pública de reservas"  ON reservas;
DROP POLICY IF EXISTS "reservas_leitura_publica"         ON reservas;
DROP POLICY IF EXISTS "reservas_insercao_publica"        ON reservas;
DROP POLICY IF EXISTS "reservas_atualizacao_auth"        ON reservas;
DROP POLICY IF EXISTS "reservas_exclusao_auth"           ON reservas;

-- Leitura pública — necessária para validar reservas ativas no index
CREATE POLICY "Leitura pública de reservas"
    ON reservas FOR SELECT
    TO anon USING (true);

-- Inserção pública — alunos/funcionários fazem reserva sem login
CREATE POLICY "Inserção pública de reservas"
    ON reservas FOR INSERT
    TO anon WITH CHECK (true);

-- Escrita completa para admin autenticado (INSERT, UPDATE, DELETE)
-- WITH CHECK (true) é obrigatório: sem ele o PostgREST executa UPDATE como
-- DELETE + INSERT e, se o INSERT for rejeitado silenciosamente, apenas o
-- DELETE persiste — a linha é apagada em vez de atualizada.
CREATE POLICY "Escrita autenticada de reservas"
    ON reservas FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'reservas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE reservas;
    END IF;
END $$;

-- ============================================================================
-- 14. PESSOA_ID EM EMPRÉSTIMOS
-- Vincula cada empréstimo diretamente à pessoa cadastrada via pessoa_id,
-- evitando colisão de homônimos.
-- ============================================================================

-- Adiciona pessoa_id em emprestimos (após pessoas já criada)
-- ADD COLUMN IF NOT EXISTS é seguro: não falha se a coluna já existir
ALTER TABLE emprestimos ADD COLUMN IF NOT EXISTS pessoa_id BIGINT REFERENCES pessoas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_emprestimos_pessoa_id ON emprestimos(pessoa_id);

-- ═══════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Preencher pessoa_id nos empréstimos existentes
-- Seguro rodar múltiplas vezes — só afeta registros com pessoa_id NULL
-- ATENÇÃO: Se houver nomes duplicados em pessoas, o id mais antigo (menor)
--          será usado. Revise manualmente se necessário.
-- ═══════════════════════════════════════════════════════════════
UPDATE emprestimos e
SET pessoa_id = (
    SELECT p.id FROM pessoas p
    WHERE UPPER(p.nome) = UPPER(e.nome_aluno)
    ORDER BY p.id ASC
    LIMIT 1
)
WHERE e.pessoa_id IS NULL
  AND e.nome_aluno IS NOT NULL;

-- Verificar vínculos após migração:
-- SELECT e.nome_aluno, e.pessoa_id, p.nome
-- FROM emprestimos e
-- LEFT JOIN pessoas p ON p.id = e.pessoa_id
-- WHERE e.pessoa_id IS NULL
-- LIMIT 20;
