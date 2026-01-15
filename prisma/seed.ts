import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  await prisma.refreshToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuários
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@eyewear.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      phone: '(11) 99999-9999',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Cliente Exemplo',
      role: 'CUSTOMER',
      phone: '(11) 88888-8888',
      addresses: {
        create: {
          street: 'Rua Exemplo',
          number: '123',
          complement: 'Apto 45',
          district: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01001-000',
          isDefault: true,
        },
      },
    },
  });

  // Criar categorias
  const sunglasses = await prisma.category.create({
    data: {
      name: 'Óculos de Sol',
      description: 'Óculos para proteção solar com estilo',
      slug: 'oculos-de-sol',
    },
  });

  const eyeglasses = await prisma.category.create({
    data: {
      name: 'Óculos de Grau',
      description: 'Óculos para correção visual com design moderno',
      slug: 'oculos-de-grau',
    },
  });

  const sportsglasses = await prisma.category.create({
    data: {
      name: 'Óculos Esportivos',
      description: 'Óculos especiais para prática esportiva',
      slug: 'oculos-esportivos',
    },
  });

  // Criar marcas
  const rayban = await prisma.brand.create({
    data: {
      name: 'Ray-Ban',
      description: 'Marca icônica de óculos fundada em 1936',
      logo: '/brands/rayban-logo.png',
    },
  });

  const oakley = await prisma.brand.create({
    data: {
      name: 'Oakley',
      description: 'Marca especializada em óculos esportivos de alta performance',
      logo: '/brands/oakley-logo.png',
    },
  });

  const gucci = await prisma.brand.create({
    data: {
      name: 'Gucci',
      description: 'Marca italiana de luxo fundada em 1921',
      logo: '/brands/gucci-logo.png',
    },
  });

  // Criar produtos
  const aviator = await prisma.product.create({
    data: {
      name: 'Ray-Ban Aviator Classic',
      description: 'O Ray-Ban Aviator Classic é um modelo icônico que transcende gerações. Criado originalmente para pilotos da Força Aérea Americana em 1937, este modelo se tornou um símbolo de estilo atemporal.',
      price: 899.90,
      stock: 50,
      sku: 'RB-AV-001',
      slug: 'ray-ban-aviator-classic',
      material: 'Metal',
      gender: 'UNISEX',
      frameColor: 'Dourado',
      lensColor: 'Verde G-15',
      frameShape: 'AVIATOR',
      categoryId: sunglasses.id,
      brandId: rayban.id,
      images: {
        create: [
          {
            url: '/products/rayban-aviator-1.jpg',
            alt: 'Ray-Ban Aviator Classic - Frontal',
            isMain: true,
          },
          {
            url: '/products/rayban-aviator-2.jpg',
            alt: 'Ray-Ban Aviator Classic - Lateral',
            isMain: false,
          },
        ],
      },
    },
  });

  const holbrook = await prisma.product.create({
    data: {
      name: 'Oakley Holbrook',
      description: 'O Oakley Holbrook é inspirado no espírito de exploração e aventura. Com design retangular e tecnologia de lentes de alta definição, oferece proteção superior e estilo inconfundível.',
      price: 750.00,
      stock: 35,
      sku: 'OAK-HB-001',
      slug: 'oakley-holbrook',
      material: 'O-Matter',
      gender: 'MALE',
      frameColor: 'Preto Fosco',
      lensColor: 'Prizm Ruby',
      frameShape: 'SQUARE',
      categoryId: sunglasses.id,
      brandId: oakley.id,
      images: {
        create: [
          {
            url: '/products/oakley-holbrook-1.jpg',
            alt: 'Oakley Holbrook - Frontal',
            isMain: true,
          },
          {
            url: '/products/oakley-holbrook-2.jpg',
            alt: 'Oakley Holbrook - Lateral',
            isMain: false,
          },
        ],
      },
    },
  });

  const gucciGG = await prisma.product.create({
    data: {
      name: 'Gucci GG0396S',
      description: 'O Gucci GG0396S representa o luxo e sofisticação da marca italiana. Com design oversized e detalhes dourados, este modelo é perfeito para quem busca exclusividade e elegância.',
      price: 1899.90,
      stock: 15,
      sku: 'GUC-GG-001',
      slug: 'gucci-gg0396s',
      material: 'Acetato',
      gender: 'FEMALE',
      frameColor: 'Preto',
      lensColor: 'Cinza Degradê',
      frameShape: 'OVERSIZED',
      categoryId: sunglasses.id,
      brandId: gucci.id,
      images: {
        create: [
          {
            url: '/products/gucci-gg0396s-1.jpg',
            alt: 'Gucci GG0396S - Frontal',
            isMain: true,
          },
          {
            url: '/products/gucci-gg0396s-2.jpg',
            alt: 'Gucci GG0396S - Lateral',
            isMain: false,
          },
        ],
      },
    },
  });

  // Criar carrinho para o cliente
  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      items: {
        create: [
          {
            productId: aviator.id,
            quantity: 1,
          },
        ],
      },
    },
  });

  // Criar um pedido para o cliente
  const address = await prisma.address.findFirst({
    where: { userId: customer.id },
  });

  if (address) {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-2025-0001',
        total: 899.90,
        shippingCost: 0.00,
        status: 'DELIVERED',
        userId: customer.id,
        addressId: address.id,
        items: {
          create: [
            {
              productId: aviator.id,
              quantity: 1,
              price: 899.90,
            },
          ],
        },
        payment: {
          create: {
            amount: 899.90,
            status: 'SUCCEEDED',
            paymentMethod: 'CREDIT_CARD',
            paymentIntentId: 'pi_mock_123456',
            paymentProviderId: 'cus_mock_123456',
          },
        },
      },
    });
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

