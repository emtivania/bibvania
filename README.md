# BibVania v2.0

## Changelog

> Mudanças entre as versões **1.8 → 2.0**
> Esta seção é atualizada a cada versão e registra apenas as alterações mais recentes.

### ✅ Adicionado
— *(sem registros para esta versão)*

### 🔄 Atualizado / Melhorado
— *(sem registros para esta versão)*

### ❌ Removido
— *(sem registros para esta versão)*

### 🗄️ SQL / Supabase
— *(sem registros para esta versão)*

---

**Sistema de Biblioteca Escolar Digital**
da EMTI Professora Maria Vânia Farias Linhares

> 🌐 **[Acessar o acervo público](https://emtivania.github.io/bibvania/)** · Desenvolvido por [Ruan Oliveira Lima](https://github.com/ruanolima) · Licença [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)

---

## Sobre

BibVania é um sistema web de gerenciamento de biblioteca.
Permite consulta pública do acervo, painel administrativo, controle de empréstimos e cadastro de livros com inteligência artificial.
Roda 100% no navegador, sem servidor próprio.

---

## Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript vanilla (sem frameworks, sem build tools)
- **Banco de dados / Auth / Realtime:** [Supabase](https://supabase.com) (PostgreSQL)
- **IA — metadados:** Open Library (sem chave, uso público)
- **Upload de capas:** [ImgBB](https://imgbb.com) (chave gratuita)
- **Hospedagem sugerida:** GitHub Pages

---

## Funcionalidades

### Acervo público (`index.html`)
- Busca por título, ISBN, autor e palavras-chave
- Tags de palavras-chave clicáveis
- Capas dos livros com lightbox
- Indicação visual de disponibilidade em tempo real
- Acessibilidade: busca por voz, modo escuro

### Painel administrativo (`admin.html`)
- Cadastro, edição e exclusão de livros com upload de capa via ImgBB
- Controle de empréstimos: registrar, editar, renovar, devolver, excluir
- Cadastro de alunos e funcionários
- Realtime: atualiza automaticamente sem recarregar
- Cadastro rápido com IA integrado

### Login (`login.html`)
- Autenticação por e-mail e senha via Supabase Auth

---

## Estrutura de arquivos

```
BibVania/
├── index.html               — Acervo público
├── admin.html               — Painel do bibliotecário
├── login.html               — Autenticação
├── bibmaker.html            — Criador de bibliotecas (BibMaker)
├── bibcore.js              — Banco de dados, utilitários e transições
├── style.css                — Estilos globais
├── logo.png                 — Logo do sistema
├── favicon.png              — Favicon
├── og-image.png             — Imagem Open Graph
├── VERSION.json             — Versão do sistema
├── supabase_setup.sql       — Configuração inicial do banco
├── setup_private.sql        — Chaves de API (ImgBB e Groq) — NÃO subir ao GitHub
├── bibspeech_api.js         — Leitor de tela (BibSpeech)
├── bibspeech.conf           — Configuração de pronúncias do BibSpeech
├── bibspeech-logo.png       — Logo do BibSpeech
└── README.md                — Este arquivo
```

---

## BibTools

Ferramentas do ecossistema BibVania que estendem ou complementam o sistema principal.

---

### 🔧 BibMaker

Ferramenta web para criar e atualizar bibliotecas personalizadas baseadas no BibVania.
Não requer servidor — funciona 100% no navegador.

**Como usar:**

- Acesse `bibmaker.html` no repositório do BibVania ou na sua instalação local
- **Aba Cadastro:** preencha os dados da biblioteca (nome, chaves de API, imagens) e gere um ZIP pronto para publicar no GitHub Pages
- **Aba Atualização:** envie o ZIP de uma biblioteca existente para atualizá-la para a versão mais recente do BibVania, preservando todos os dados configurados

O ZIP gerado inclui todos os arquivos do sistema já personalizados, além de `README.md`, `LICENCE.md`, `VERSION.json`, `setup_private.sql` e um log de modificações (`[nomeBiblioteca].bak`).

> ⚠️ O arquivo `setup_private.sql` contém suas chaves de API — **não suba ao GitHub**.

---

### 📚 BibFiles

Arquivo digital de livros integrado ao sistema.
Permite armazenar, visualizar e verificar a integridade de PDFs públicos diretamente pelo navegador.

**Recursos:**
- Upload de PDFs para o [Internet Archive](https://archive.org) (armazenamento gratuito e ilimitado)
- Assinatura SHA-256 para verificação de integridade
- Listagem paginada com busca
- PDFs abrem em nova aba sem download obrigatório

**Como acessar:** clique em **BibFiles** no menu de atalhos de qualquer página do sistema, ou acesse `bibfiles.html` diretamente.

#### Chave de API — Internet Archive

O BibFiles usa a API S3 do Internet Archive para armazenar os PDFs. A chave é gratuita e vinculada à sua conta.

**Como obter:**

1. Crie uma conta em [archive.org](https://archive.org) (gratuita)
2. Acesse [archive.org/account/s3.php](https://archive.org/account/s3.php)
3. Copie a **S3 Access Key** e a **S3 Secret Key**

**Como inserir:**

Abra `setup_private.sql` e substitua o valor da chave `internetarchive_api_key` no formato `access_key:secret_key`:

```sql
INSERT INTO config_privada (chave, valor)
VALUES ('internetarchive_api_key', '<<SUA_ACCESS_KEY_IA:SUA_SECRET_KEY_IA>>')
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;
```

A chave é lida diretamente da tabela `config_privada` pelo `bibfiles.html` após login — nunca fica exposta no código-fonte.

> ⚠️ Não suba o `setup_private.sql` com as chaves reais para o GitHub.

---

### 🔊 BibSpeech

Leitor de tela integrado ao sistema, baseado na Web Speech API nativa do navegador.
Não depende de extensões nem de leitores externos.

#### Como usar

1. Na página, clique no botão 👁️‍🗨️ para abrir o leitor de tela
2. Aguarde ouvir **"Leitura de Tela Ativada"** antes de navegar
3. Navegue pelos elementos da página — o leitor lerá automaticamente o conteúdo em foco
4. **Atalhos disponíveis:**
   - **Setas do teclado** — navegar entre elementos
   - **Enter** ou botão Interagir — acionar o elemento em foco (botão, link etc.)
   - **Espaço** ou botão Pausar/Continuar — pausar ou continuar a leitura
   - **L** ou botão Ler Página — ler toda a página a partir de onde parou
   - **Esc** ou botão Cancelar — cancelar a leitura
   - **Ctrl** — abrir ou fechar o leitor de tela
   - **?** ou **Shift** — abrir ou fechar o painel de ajuda

#### Como configurar o `.conf`

O arquivo `bibspeech.conf` permite personalizar pronúncias e o idioma da leitura:

**Idioma:**
```
lang = pt_BR   — Português (Brasil)
lang = pt_PT   — Português (Portugal)
lang = en_US   — Inglês (EUA)
lang = es_ES   — Espanhol
```

**Pronúncias personalizadas:**
```
termo = pronúncia
```

Exemplo:
```
bibvania = bibvânia
github = guitirrâbe
```

- Linhas começando com `#` são comentários e são ignoradas
- O termo é insensível a maiúsculas/minúsculas
- Em atualizações do sistema, suas modificações são preservadas; em caso de conflito, prevalece a versão da sua biblioteca

#### Como instalar em outro site

1. Copie os arquivos `bibspeech_api.js`, `bibspeech.conf` e `bibspeech-logo.png` para o seu projeto
2. Inclua o script antes do `</body>` da página:
```html
<script src="bibspeech_api.js"></script>
```
3. Adicione um botão para abrir o leitor:
```html
<button id="leitorTelaBtn" onclick="abrirLeitorTela()">Leitor de tela</button>
```
4. O script injeta automaticamente o CSS, o painel e o popup no DOM — nenhuma configuração adicional é necessária

---

## Configuração inicial

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project**, escolha um nome e senha forte
3. Ative o **Row Level Security (RLS)** nas tabelas após executar o SQL de configuração
4. Aguarde o projeto ser criado

### 2. Executar o SQL de configuração

1. No menu lateral, vá em **SQL Editor → New query**
2. Cole o conteúdo de `supabase_setup.sql` e clique em **Run**

### 3. Inserir as chaves de API privadas

Execute o `setup_private.sql` no **SQL Editor** do Supabase. O arquivo já vem com as chaves configuradas pelo BibMaker.

> ⚠️ Nunca suba o `setup_private.sql` ao GitHub nem o compartilhe de nenhuma forma — ele contém suas chaves privadas de API.

### 4. Inserir as credenciais no código

Abra `bibcore.js` e substitua:

```js
const supabaseUrl = "https://SEU_PROJETO.supabase.co";
const supabaseKey = "SUA_CHAVE_ANON_PUBLIC";
```

### 5. Criar o usuário bibliotecário

1. No Supabase, vá em **Authentication → Users**
2. Clique em **Add user** e informe e-mail e senha
3. Para adicionar um username ao usuário, execute no **SQL Editor**, substituindo os valores:

```sql
INSERT INTO admins (id, nome) VALUES ('uuid-do-usuario', 'Nome do Admin');
```

### 6. Publicar no GitHub Pages

1. Suba todos os arquivos em um repositório público
2. Vá em **Settings → Pages → Source → Deploy from a branch**
3. Escolha o branch `main` e pasta `/ (root)` → **Save**

> ⚠️ Não suba o `setup_private.sql` com as chaves reais para o GitHub.
