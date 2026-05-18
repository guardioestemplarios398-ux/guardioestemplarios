# Guardiões Templários Check-in

Sistema de check-in por QR Code com formulário público, painel administrativo, filtros diário/semanal/mensal/anual/personalizado, exportação CSV, gerenciamento de eventos e geração de QR Code.

## Tecnologias

- React + Vite
- Supabase Auth + PostgreSQL + RLS
- Netlify
- QR Code via `qrcode.react`
- Gráficos via `recharts`

## Rotas principais

```txt
/checkin/checkin-diario-templo      Página pública do QR Code
/success                           Confirmação do check-in
/admin/login                       Login administrativo
/admin/dashboard                   Dashboard com filtros
/admin/checkins                    Tabela e exportação
/admin/events                      Eventos
/admin/qrcode                      Gerador de QR Code
```

## 1. Criar banco no Supabase

No Supabase, acesse:

```txt
SQL Editor > New Query
```

Execute o arquivo:

```txt
supabase/schema.sql
```

Depois execute, apenas em teste, o arquivo:

```txt
supabase/create-admin-test.sql
```

Login de teste criado pelo SQL:

```txt
E-mail: douglasnoticias@gmail.com
Senha: tabella1991
```

Em produção, altere essa senha e rotacione as chaves de teste.

## 2. Configurar variáveis de ambiente local

Copie o arquivo `.env.example` para `.env`:

```bash
copy .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha a chave pública do Supabase:

```env
VITE_SUPABASE_URL=https://gavtqnjppepegzwwigkt.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_public_ou_publishable
VITE_APP_PUBLIC_URL=http://localhost:5173
```

> Nunca coloque `service_role`, `secret key` ou qualquer chave sensível no front-end, GitHub ou Netlify público.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```txt
http://localhost:5173
```

## 4. Subir para GitHub

Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "primeira versao guardioes templarios checkin"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/guardioes-templarios-checkin.git
git push -u origin main
```

## 5. Publicar no Netlify

No Netlify:

```txt
Add new site > Import an existing project > GitHub
```

Build command:

```txt
npm run build
```

Publish directory:

```txt
dist
```

Adicione as variáveis em:

```txt
Site configuration > Environment variables
```

```env
VITE_SUPABASE_URL=https://gavtqnjppepegzwwigkt.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_public_ou_publishable
VITE_APP_PUBLIC_URL=https://seu-site.netlify.app
```

## 6. Liberar URL no Supabase

Em Supabase:

```txt
Authentication > URL Configuration
```

Configure:

```txt
Site URL: https://seu-site.netlify.app
Redirect URLs:
https://seu-site.netlify.app/*
http://localhost:5173/*
```

## 7. Segurança

- O front-end usa somente chave pública.
- As tabelas usam RLS.
- Visitante pode apenas visualizar evento ativo e inserir check-in.
- Visitante não consegue listar check-ins.
- Apenas administradores presentes em `admin_users` conseguem visualizar painel e relatórios.

## 8. QR Code inicial

O QR Code inicial deve apontar para:

```txt
https://seu-site.netlify.app/checkin/checkin-diario-templo
```

No painel `/admin/qrcode`, o sistema gera e baixa o QR Code automaticamente.


## Botão discreto de administrador

A tela pública de check-in possui um botão pequeno no canto inferior direito com o texto `Admin`.
Ele direciona para:

```txt
/admin/login
```

Esse botão é discreto para não atrapalhar o check-in público, mas permite acesso rápido ao painel administrativo.


## Login administrativo local

Esta versão não usa mais Supabase Auth para o painel administrativo.

Os usuários administrativos ficam na tabela:

```txt
app_admin_users
```

Logins criados no SQL:

```txt
Usuário: douglas francisco
Senha: 123456

Usuário: cristian valente
Senha: 123456
```

Execute no Supabase o arquivo:

```txt
supabase/local-admin-login.sql
```

Depois publique novamente no Netlify.


## Atualização: visualizar senha e reset de login local

A tela de login agora possui botão para visualizar/ocultar senha.

Execute novamente no Supabase:

```txt
supabase/local-admin-login.sql
```

Esse SQL recria os usuários locais e reseta as senhas:

```txt
douglas francisco / 123456
cristian valente / 123456
```

No final do SQL, o teste abaixo precisa retornar uma linha:

```sql
select display_name, role, expires_at
from public.local_admin_login('douglas francisco', '123456');
```


## Correção do erro `function crypt(text, text) does not exist`

Execute no Supabase:

```txt
supabase/correcao-crypt-login.sql
```

Essa correção ajusta as funções para usar `search_path = public, extensions`, porque no Supabase a extensão `pgcrypto` costuma ficar no schema `extensions`.

Depois teste no painel:

```txt
douglas francisco / 123456
cristian valente / 123456
```


## Alteração de senha pelo painel

O painel administrativo agora possui a rota:

```txt
/admin/alterar-senha
```

A opção também aparece no menu lateral como **Alterar senha**.

Execute novamente o SQL:

```txt
supabase/correcao-crypt-login.sql
```

Ele cria a função:

```txt
local_admin_change_password
```

Depois suba o projeto e faça novo deploy no Netlify.


## Logo Guardiões Templários

A logo institucional foi incluída em:

```txt
public/logo-guardioes-templarios.png
```

Ela aparece na tela pública de check-in, login administrativo, menu lateral do painel, favicon e como marca d'água discreta no layout.


## Correção do QR Code

O QR Code agora usa automaticamente o domínio atual do Netlify:

```txt
window.location.origin
```

Assim ele não depende mais da variável `VITE_APP_PUBLIC_URL` para gerar o link do check-in.

No painel, em **QR Code**, também foi adicionado o botão:

```txt
Abrir link de teste
```

Use esse botão para validar o link antes de imprimir ou compartilhar o QR.


## Alteração dos campos do check-in

O formulário público foi atualizado:

```txt
Saiu: WhatsApp / Telefone
Entrou: CIM

Saiu: E-mail
Entrou: Grau
Opções: Aprendiz, Companheiro, Mestre
```

Nome utilizado no sistema:

```txt
Guardiões Templários 33 N° 4637
```

Execute no Supabase:

```txt
supabase/correcao-crypt-login.sql
```

ou, para aplicar apenas as colunas novas:

```txt
supabase/migracao-cim-grau-loja.sql
```
