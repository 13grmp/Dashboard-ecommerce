# 🗄️ Guia de Migração do Banco de Dados

## Migração de PostgreSQL para SQLite

A partir de outubro de 2025, o projeto foi migrado de PostgreSQL para SQLite para simplificar o processo de desenvolvimento e instalação.

## 1. Pré-requisitos

- Node.js instalado
- NPM ou Yarn instalado

## 2. Configuração do SQLite

O banco de dados SQLite é armazenado localmente no arquivo `prisma/dev.db`. Não é necessário configurar nenhuma string de conexão no arquivo `.env`.

## 3. Mudanças no Schema

As seguintes alterações foram feitas no schema do Prisma para compatibilidade com SQLite:

1. Alteração do provedor para SQLite
2. Substituição dos campos Decimal para Float:
   - Product.price
   - Order.total
   - Order.shippingCost
   - Order.discount
   - OrderItem.price
   - Payment.amount

## 4. Comandos para Migração

Execute os seguintes comandos em ordem:

```bash
# 1. Instalar dependências
npm install

# 2. Gerar cliente Prisma
npx prisma generate

# 3. Aplicar migrações existentes
npx prisma migrate deploy

# 4. Aplicar nova migração com melhorias
npx prisma migrate dev --name improvements_20250821

# 5. Verificar status das migrações
npx prisma migrate status

# 6. Popular dados iniciais (se necessário)
npx prisma db seed
```

## 5. Verificações Após Migração

Para verificar se a migração foi bem sucedida:

1. Execute `npx prisma studio` para visualizar o banco de dados
2. Verifique se os dados foram populados corretamente
3. Teste as funcionalidades do sistema que envolvem valores monetários
4. Confirme se o arquivo `prisma/dev.db` foi criado

## 6. Comandos Úteis

```bash
# Visualizar banco de dados
npx prisma studio

# Reset completo do banco (cuidado: apaga todos os dados)
npx prisma migrate reset

# Verificar estrutura atual do banco
npx prisma db pull
```

## 7. Resolução de Problemas

### Se houver erro na migração:

1. Verifique os logs de erro
2. Confirme se o usuário do banco tem permissões suficientes
3. Verifique a conexão com o banco

### Se precisar reverter:

```bash
# Reverter última migração
npx prisma migrate reset
```

## 8. Backup (Recomendado)

O banco de dados SQLite é armazenado em um único arquivo. Para fazer backup:

1. Copie o arquivo `prisma/dev.db` para um local seguro
2. Para restaurar, substitua o arquivo `prisma/dev.db` pelo backup

Nota: Certifique-se de que o aplicativo não está em execução ao fazer o backup ou restauração.

## 9. Verificação Final

Após a migração, verifique:

1. Se todos os índices foram criados
2. Se as constraints estão corretas
3. Se os dados existentes estão preservados
4. Se as novas funcionalidades estão funcionando

## 10. Próximos Passos

Após confirmar que tudo está funcionando:

1. Faça um backup do banco atualizado
2. Atualize a documentação se necessário
3. Teste as APIs que dependem do banco
4. Monitore o desempenho das queries

## ⚠️ Importante

- Sempre faça backup antes de qualquer migração
- Teste em ambiente de desenvolvimento primeiro
- Mantenha os scripts de migração versionados
- Documente qualquer problema encontrado
