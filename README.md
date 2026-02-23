# Nexora ERP - Pedidos de Venda (SaaS Multiempresa)

Sistema web de pedidos de venda com fluxo ERP profissional, inspirado na organização do Mercus ERP, agora com base SaaS multiempresa.

## Stack
- Next.js 14+ (App Router) + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind CSS
- react-hook-form + zod
- pdf-lib (PDF server-side)
- Recharts

## Configuração

1. **Instale dependências**
```bash
npm install
```

2. **Crie o projeto no Supabase**
- Crie um novo projeto.
- Copie a `URL` e a `Anon Key`.

3. **Crie o bucket de imagens**
- Em Storage, crie o bucket `product-images`.
- Marque como **Public** para permitir exibição das imagens.

4. **Aplique o SQL**
- Abra o SQL Editor do Supabase.
- Execute o conteúdo do arquivo `supabase/schema.sql`.

5. **Configure as variáveis de ambiente**
- Copie `.env.local.example` para `.env.local`.
- Preencha com as credenciais do Supabase.

6. **Execute o projeto**
```bash
npm run dev
```

## Fluxo principal
- Acesse `/login` e crie sua conta.
- Cada conta nova cria automaticamente uma empresa e um membro `owner`.
- Convites pendentes para o e-mail usado no login são aceitos automaticamente.
- Cadastre clientes e produtos.
- Crie pedidos (rascunho) e confirme para baixar estoque e gerar contas a receber.
- Registre pagamentos manualmente.
- Gerencie funcionários em `/equipe` (convites, papel e inativação).
- Gere PDF pelo botão **PDF** na lista de pedidos.

## Observações
- O bloqueio de venda sem estoque pode ser configurado em `Configurações`.
- O PDF inclui dados do cliente, itens com imagem, e status financeiro.
- O schema atual foi desenhado para base nova. Se já existe banco em produção com o schema antigo por `user_id`, faça migração SQL antes de atualizar o app.

# NexoraERP
