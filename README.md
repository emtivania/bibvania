# BibVania v1.3

**Sistema de Biblioteca Escolar Digital**
EMTI Professora Maria Vânia Farias Linhares

> 🌐 **[Acessar o acervo público](https://emtivania.github.io/bibvania/)** · Desenvolvido por [emtivania](https://github.com/emtivania) · Licença [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/)

---

## Sobre

BibVania é um sistema web para gerenciamento de biblioteca escolar, com acervo público, painel administrativo, controle de empréstimos, cadastro de pessoas, relatórios e cadastro rápido de livros com inteligência artificial. Roda 100% no navegador, sem servidor próprio.

---

## Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript vanilla (sem frameworks, sem build tools)
- **Banco de dados / Auth / Realtime:** [Supabase](https://supabase.com) (PostgreSQL)
- **IA — análise visual:** [Groq](https://groq.com) com modelo Llama 4 Scout (chave gratuita)
- **IA — metadados:** Google Books API (sem chave, uso público)
- **Upload de capas:** [ImgBB](https://imgbb.com) (chave gratuita)
- **Tradução automática:** Google Translate (sem chave, uso público)
- **Hospedagem sugerida:** GitHub Pages

---

## Funcionalidades

### Acervo público (`index.html`)
- Busca por título, ISBN, autor, editora, sinopse e palavras-chave (com suporte a `#tag`)
- Tags de palavras-chave clicáveis — filtram o acervo automaticamente
- Capas dos livros com lightbox em tela cheia
- Indicação visual de disponibilidade em tempo real
- Acessibilidade: busca por voz, A+/A−, modo escuro, VLibras

### Painel administrativo (`admin.html`)
- Cadastro, edição e exclusão de livros com upload de capa (câmera ou galeria) via ImgBB
- Controle de empréstimos: registrar, editar, renovar, devolver, excluir
- Aba de devoluções com indicador de urgência por cor (🔴🟡🟢⚪⚫) na aba e nos cards
- Cadastro de alunos e funcionários com suporte a Ensino Médio (checkbox EM → salva como ano 10/11/12)
- Lista de pessoas por turma com histórico de empréstimos por acordeão
- Realtime: atualiza automaticamente sem recarregar
- Cadastro rápido com IA integrado diretamente no painel

### Cadastro rápido com IA
- **Foto da capa → IA identifica:** título, autor, ISBN, categoria, palavras-chave e descrição de acessibilidade
- **Groq (Llama 4 Scout):** análise visual da capa
- **Google Books:** complementa ISBN, sinopse e editora — com validação de relevância
- **Tradução automática:** sinopses em inglês são traduzidas automaticamente para português
- Detecta livros já cadastrados e permite atualizar quantidade com um toque
- Aba de acervo integrada para edição rápida de qualquer livro com IA
- Histórico de cadastros da sessão

### Login (`login.html`)
- Autenticação por e-mail e senha via Supabase Auth
- Redirecionamento automático se já autenticado

### BibMaker (`bibmaker.html`)
- Página dedicada para criação de novas bibliotecas baseadas no BibVania
- Logo, favicon e og-image próprios

---

## Estrutura de arquivos

```
BibVania/
├── index.html               — Acervo público
├── admin.html               — Painel do bibliotecário
├── login.html               — Autenticação
├── bibmaker.html            — Criador de bibliotecas (BibMaker)
├── bibvania.js              — Banco de dados, utilitários e transições (arquivo unificado)
├── style.css                — Estilos globais (dark/light mode, responsivo)
├── logo.png                 — Logo do sistema
├── favicon.png              — Favicon
├── og-image.png             — Imagem de compartilhamento (Open Graph)
├── bibmaker-logo.png        — Logo do BibMaker
├── bibmaker-favicon.png     — Favicon do BibMaker (fundo transparente)
├── bibmaker-og-image.png    — Imagem de compartilhamento do BibMaker
├── supabase_setup.sql       — Configuração inicial do banco (executar primeiro)
├── setup_private.sql        — Chaves de API privadas: Groq e ImgBB (não subir ao GitHub)
└── README.md                — Este arquivo
```

---

## Configuração inicial

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **New Project**, escolha um nome e uma senha forte para o banco
3. Aguarde o projeto ser criado (pode levar 1–2 minutos)

### 2. Executar o SQL de configuração

1. No menu lateral, vá em **SQL Editor → New query**
2. Cole o conteúdo completo de `supabase_setup.sql` e clique em **Run**
3. Todas as tabelas, triggers, RLS e políticas serão criados automaticamente

### 3. Inserir as chaves de API privadas

1. Acesse [console.groq.com](https://console.groq.com) e crie uma chave gratuita (começa com `gsk_...`)
2. Acesse [api.imgbb.com](https://api.imgbb.com) e obtenha sua chave de API
3. Abra `setup_private.sql`, substitua os dois valores marcados com `<<SUA_CHAVE_AQUI>>`
4. Execute o arquivo no **SQL Editor** do Supabase

### 4. Encontrar as chaves do Supabase

1. No menu lateral, vá em **Project Settings → API**
2. Copie o **Project URL** (`https://xxxx.supabase.co`) e a chave **anon public** (`eyJ...`)

### 5. Inserir as credenciais no código

Abra `bibvania.js` e substitua nas linhas iniciais da seção de banco de dados:

```js
const supabaseUrl = "https://SEU_PROJETO.supabase.co";
const supabaseKey = "SUA_CHAVE_ANON_PUBLIC";
```

### 6. Criar o usuário bibliotecário

1. No Supabase, vá em **Authentication → Users**
2. Clique em **Add user** e informe o e-mail e senha do bibliotecário

### 7. Publicar no GitHub Pages

1. Suba todos os arquivos em um repositório público no GitHub
2. Vá em **Settings → Pages → Source → Deploy from a branch**
3. Escolha o branch `main` e a pasta `/ (root)` → **Save**
4. Em alguns minutos o site estará disponível em `https://seu-usuario.github.io/BibVania/`

> ⚠️ Não suba o `setup_private.sql` com as chaves reais para o GitHub.

---

## Histórico de versões

| Funcionalidade | v1.0 | v1.1 | v1.2 | v1.3 |
|---|:---:|:---:|:---:|:---:|
| Acervo público com busca | ✅ | ✅ | ✅ | ✅ |
| Painel administrativo | ✅ | ✅ | ✅ | ✅ |
| Controle de empréstimos | ✅ | ✅ | ✅ | ✅ |
| Modo escuro / A+/A− / VLibras | ✅ | ✅ | ✅ | ✅ |
| Capas dos livros | ❌ | ✅ | ✅ | ✅ |
| Busca por voz | ❌ | ✅ | ✅ | ✅ |
| Cadastro de pessoas | ❌ | ✅ | ✅ | ✅ |
| Lista de pessoas por turma | ❌ | ✅ | ✅ | ✅ |
| Relatórios anual e mensal | ❌ | ❌ | ✅ | ✅ |
| Tela de transição animada | ❌ | ❌ | ✅ | ✅ |
| Palavras-chave com busca por #tag | ❌ | ❌ | ✅ | ✅ |
| Cadastro rápido com IA (Groq + Google Books) | ❌ | ❌ | ✅ | ✅ |
| Análise visual de capa (Llama 4 Scout) | ❌ | ❌ | ✅ | ✅ |
| Tradução automática de sinopse | ❌ | ❌ | ✅ | ✅ |
| Validação de relevância do Google Books | ❌ | ❌ | ✅ | ✅ |
| Edição de livro com IA pelo acervo | ❌ | ❌ | ✅ | ✅ |
| Histórico de empréstimos por pessoa | ❌ | ❌ | ✅ | ✅ |
| Upload de capa: câmera ou galeria | ❌ | ❌ | ✅ | ✅ |
| Indicadores de urgência nas devoluções | ❌ | ❌ | ✅ | ✅ |
| Suporte a Ensino Médio (ano 10/11/12) | ❌ | ❌ | ✅ | ✅ |
| Categorias didáticas EM 1º/2º/3º | ❌ | ❌ | ✅ | ✅ |
| Renderização incremental do acervo | ❌ | ❌ | ✅ | ✅ |
| Upload de capas via ImgBB (permanente) | ❌ | ❌ | ❌ | ✅ |
| Chaves de API armazenadas no Supabase | ❌ | ❌ | ❌ | ✅ |
| Arquivo JS unificado (`bibvania.js`) | ❌ | ❌ | ❌ | ✅ |
| Botão "Repositório" na barra de acessibilidade | ❌ | ❌ | ❌ | ✅ |
| Botão "Crie sua Bib!" linkando ao BibMaker | ❌ | ❌ | ❌ | ✅ |
| Página BibMaker com identidade visual própria | ❌ | ❌ | ❌ | ✅ |
| Script de configuração de chaves (`setup_private.sql`) | ❌ | ❌ | ❌ | ✅ |

---

## Licença

[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) — Livre para usar, adaptar e distribuir com atribuição ao autor.
