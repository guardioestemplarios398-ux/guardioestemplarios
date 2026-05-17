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
