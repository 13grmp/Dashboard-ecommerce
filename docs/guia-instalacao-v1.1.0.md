# Guia de Instalação e Configuração

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Git**

Nota: O projeto agora usa SQLite como banco de dados, então não é necessário instalar o PostgreSQL.

## Passo a Passo

### 1. Clonar o Projeto

```bash
# Se você tiver o projeto em um repositório Git
git clone <url-do-repositorio>
cd eyewear-dashboard

# Ou se você baixou o arquivo compactado
tar -xzvf eyewear-dashboard.tar.gz
cd eyewear-dashboard
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar o Banco de Dados

O projeto utiliza SQLite como banco de dados, que é um banco de dados embutido que não requer instalação separada. O arquivo do banco de dados será criado automaticamente na pasta `prisma/dev.db` quando você executar as migrações.

### 4. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Banco de Dados (SQLite)
# Não é necessário configurar DATABASE_URL, o SQLite usa um arquivo local

# JWT Secret (gere uma chave segura)
JWT_SECRET="sua-chave-secreta-jwt-muito-segura-aqui"

# Diretório de Upload
UPLOAD_DIR="./public/uploads"

# Stripe (obtenha suas chaves em https://dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_sua_chave_secreta_stripe"
STRIPE_WEBHOOK_SECRET="whsec_sua_chave_webhook_stripe"
STRIPE_PUBLIC_KEY="pk_test_sua_chave_publica_stripe"
```

### 5. Configurar Banco de Dados

#### 5.1. Executar Migrações

```bash
npx prisma migrate dev --name init
```

#### 5.2. Popular Banco com Dados Iniciais

```bash
npx prisma db seed
```

Este comando criará:
- Usuário administrador (admin@eyewear.com / admin123)
- Categorias de exemplo
- Marcas de exemplo
- Produtos de exemplo

### 6. Criar Diretório de Upload

```bash
mkdir -p public/uploads
chmod 755 public/uploads
```

### 7. Iniciar o Servidor

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

## Configuração do Stripe

### 1. Criar Conta no Stripe

1. Acesse [https://stripe.com](https://stripe.com)
2. Crie uma conta gratuita
3. Acesse o Dashboard

### 2. Obter Chaves da API

1. No Dashboard do Stripe, vá para **Developers > API keys**
2. Copie as chaves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### 3. Configurar Webhooks

1. Vá para **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://seu-dominio.com/api/webhooks/stripe`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copie o **Signing secret** (whsec_...)

## Testando a Instalação

### 1. Verificar Banco de Dados

```bash
npx prisma studio
```

Isso abrirá uma interface web para visualizar os dados do banco.

### 2. Testar APIs

Execute o script de teste incluído:

```bash
node test-apis.js
```

### 3. Acessar Dashboard

Acesse `http://localhost:3000` no navegador para ver o dashboard.

## Usuários Padrão

Após executar o seed, você terá:

### Administrador
- **Email:** admin@eyewear.com
- **Senha:** admin123
- **Permissões:** Acesso total ao sistema

### Cliente de Teste
- **Email:** cliente@exemplo.com
- **Senha:** cliente123
- **Permissões:** Acesso de cliente

## Estrutura de Arquivos

```
eyewear-dashboard/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   ├── seed.ts               # Dados iniciais
│   └── migrations/           # Migrações do banco
├── src/
│   ├── app/
│   │   ├── api/              # APIs do backend
│   │   ├── dashboard/        # Páginas do dashboard
│   │   └── layout.tsx        # Layout principal
│   ├── components/           # Componentes React
│   ├── lib/                  # Utilitários e configurações
│   └── styles/               # Estilos CSS
├── public/
│   └── uploads/              # Arquivos enviados
├── .env                      # Variáveis de ambiente
├── package.json              # Dependências do projeto
└── README.md                 # Documentação
```

## Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Executar migrações
npx prisma migrate dev

# Resetar banco de dados
npx prisma migrate reset

# Visualizar banco de dados
npx prisma studio

# Gerar cliente Prisma
npx prisma generate
```

### Produção

```bash
# Build do projeto
npm run build

# Iniciar em produção
npm start

# Executar migrações em produção
npx prisma migrate deploy
```

## Solução de Problemas

### Erro de Acesso ao Banco de Dados

1. Verifique se o arquivo `prisma/dev.db` existe

2. Se houver problemas, você pode resetar o banco:
   ```bash
   npx prisma migrate reset
   ```

3. Se o erro persistir, exclua o arquivo `prisma/dev.db` e execute novamente:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Erro de Permissões de Upload

```bash
# Dar permissões ao diretório de upload
chmod -R 755 public/uploads
```

### Erro de Dependências

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problemas com Stripe

1. Verifique se as chaves estão corretas no `.env`
2. Certifique-se de estar usando chaves de teste (começam com `sk_test_` e `pk_test_`)
3. Verifique se o webhook está configurado corretamente

## Suporte

Se encontrar problemas durante a instalação:

1. Verifique os logs do servidor no terminal
2. Consulte a documentação do Prisma: [https://prisma.io/docs](https://prisma.io/docs)
3. Consulte a documentação do Stripe: [https://stripe.com/docs](https://stripe.com/docs)
4. Verifique se todas as dependências estão instaladas corretamente

## Próximos Passos

Após a instalação bem-sucedida:

1. **Personalize o sistema** com suas próprias categorias e produtos
2. **Configure o Stripe** com suas chaves reais para produção
3. **Implemente testes** para garantir a qualidade do código
4. **Configure um domínio** para produção
5. **Implemente backup** do banco de dados

