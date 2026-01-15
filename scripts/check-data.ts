import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Verificar usuários
  const users = await prisma.user.findMany({
    include: {
      addresses: true,
    },
  });
  console.log('Usuários:');
  console.log(JSON.stringify(users, null, 2));

  // Verificar categorias
  const categories = await prisma.category.findMany();
  console.log('\nCategorias:');
  console.log(JSON.stringify(categories, null, 2));

  // Verificar marcas
  const brands = await prisma.brand.findMany();
  console.log('\nMarcas:');
  console.log(JSON.stringify(brands, null, 2));

  // Verificar produtos
  const products = await prisma.product.findMany({
    include: {
      images: true,
      category: true,
      brand: true,
    },
  });
  console.log('\nProdutos:');
  console.log(JSON.stringify(products, null, 2));

  // Verificar carrinhos
  const carts = await prisma.cart.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
  console.log('\nCarrinhos:');
  console.log(JSON.stringify(carts, null, 2));

  // Verificar pedidos
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
  });
  console.log('\nPedidos:');
  console.log(JSON.stringify(orders, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

