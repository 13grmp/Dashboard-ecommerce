# Dashboard para Site de Venda de Óculos

Um dashboard administrativo completo para gerenciamento de uma loja de óculos, desenvolvido com Next.js, TypeScript e Shadcn UI.

## Tecnologias Utilizadas

- **Next.js**: Framework React para renderização do lado do servidor
- **TypeScript**: Linguagem de programação tipada
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn UI**: Biblioteca de componentes de UI
- **Recharts**: Biblioteca para criação de gráficos
- **SQLite**: Banco de dados local embutido
- **Prisma**: ORM para gerenciamento do banco de dados

## Funcionalidades Implementadas

### 1. Dashboard Principal
- Visão geral das métricas principais (vendas totais, pedidos, clientes, produtos)
- Gráfico de vendas mensais
- Lista dos produtos mais vendidos

### 2. Gerenciamento de Produtos
- Listagem completa de produtos com detalhes
- Filtros por categoria e status de estoque
- Busca por nome de produto
- Indicadores visuais de status de estoque (Em estoque, Baixo estoque, Sem estoque)
- Opções para adicionar, editar e excluir produtos

### 3. Gerenciamento de Vendas
- Listagem de pedidos com detalhes
- Filtros por status de pedido
- Busca por ID de pedido ou cliente
- Visualização de gráficos de análise de vendas
- Visualização de vendas por categoria

### 4. Gerenciamento de Clientes
- Listagem de clientes com detalhes de contato
- Filtros por status de cliente
- Busca por nome, email ou telefone
- Indicadores de status de cliente (Ativo, Inativo)
- Opções para adicionar, editar e excluir clientes

### 5. Relatórios e Análises
- Gráficos de vendas mensais
- Distribuição de vendas por categoria
- Vendas por região geográfica
- Desempenho por marca
- Resumo de métricas de desempenho
- Lista dos produtos mais vendidos

## Como Executar o Projeto

1. **Pré-requisitos**
   - Node.js (versão 18 ou superior)
   - npm ou yarn
   - Não é necessário instalar banco de dados, o SQLite é incluído no projeto

2. **Instalação**
   ```bash
   # Clone o repositório (se aplicável)
   git clone <url-do-repositorio>
   
   # Navegue até a pasta do projeto
   cd eyewear-dashboard
   
   # Instale as dependências
   npm install
   # ou
   yarn install
   
   # Configure o banco de dados
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Execução em ambiente de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`

4. **Build para produção**
   ```bash
   npm run build
   # ou
   yarn build
   ```

5. **Execução em ambiente de produção**
   ```bash
   npm start
   # ou
   yarn start
   ```

## Estrutura do Projeto

- `/src/app`: Páginas da aplicação (estrutura App Router do Next.js)
- `/src/components`: Componentes reutilizáveis
  - `/dashboard`: Componentes específicos do dashboard
  - `/ui`: Componentes de UI do Shadcn
- `/src/lib`: Utilitários e funções auxiliares
- `/src/components/providers`: Provedores de contexto

## Personalização

O dashboard foi desenvolvido com foco em uma loja de óculos, mas pode ser facilmente adaptado para outros tipos de e-commerce ou sistemas administrativos. Para personalizar:

1. Modifique os dados de exemplo nas páginas do dashboard
2. Ajuste as categorias e filtros conforme necessário
3. Personalize o tema e as cores no arquivo `globals.css` e `components.json`

## Responsividade

O dashboard é totalmente responsivo, adaptando-se a diferentes tamanhos de tela:
- Em dispositivos móveis, a sidebar se transforma em um menu lateral deslizante
- Os componentes se reorganizam para melhor visualização em telas menores
- As tabelas possuem rolagem horizontal em dispositivos móveis

## Próximos Passos

Para uma implementação completa em produção, considere:

1. Migração para um banco de dados mais robusto (como PostgreSQL)
2. Implementação de autenticação e autorização
3. Adição de funcionalidades de exportação de dados
4. Implementação de notificações em tempo real
5. Otimização de performance para grandes volumes de dados

## Banco de Dados

O projeto utiliza SQLite como banco de dados, o que facilita a instalação e desenvolvimento local. O banco de dados é gerenciado através do Prisma ORM.

- O arquivo do banco está localizado em `prisma/dev.db`
- O schema do banco está em `prisma/schema.prisma`
- As migrações estão em `prisma/migrations`
- Dados iniciais são inseridos através do seed em `prisma/seed.ts`

Para visualizar e gerenciar o banco de dados:
```bash
npx prisma studio
```

