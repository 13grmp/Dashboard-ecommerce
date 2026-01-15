import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';

// Listar pedidos do usuário
export async function GET(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Extrair parâmetros de consulta
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const status = url.searchParams.get('status') || undefined;

      // Validar parâmetros
      const validPage = page > 0 ? page : 1;
      const validLimit = limit > 0 && limit <= 50 ? limit : 10;
      const skip = (validPage - 1) * validLimit;

      // Construir filtros
      const filters: any = {
        userId: user.id,
      };

      if (status) {
        filters.status = status;
      }

      // Buscar pedidos
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: filters,
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isMain: true },
                      take: 1,
                    },
                  },
                },
              },
            },
            payment: true,
            address: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: validLimit,
        }),
        prisma.order.count({
          where: filters,
        }),
      ]);

      // Calcular informações de paginação
      const totalPages = Math.ceil(total / validLimit);
      const hasNextPage = validPage < totalPages;
      const hasPrevPage = validPage > 1;

      // Formatar a resposta
      const formattedOrders = orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        shippingCost: order.shippingCost,
        discount: order.discount,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            image: item.product.images.length > 0 ? item.product.images[0].url : null,
          },
          subtotal: parseFloat(item.price.toString()) * item.quantity,
        })),
        payment: order.payment ? {
          id: order.payment.id,
          amount: order.payment.amount,
          status: order.payment.status,
          paymentMethod: order.payment.paymentMethod,
          createdAt: order.payment.createdAt,
        } : null,
        address: {
          street: order.address.street,
          number: order.address.number,
          complement: order.address.complement,
          district: order.address.district,
          city: order.address.city,
          state: order.address.state,
          zipCode: order.address.zipCode,
        },
        itemCount: order.items.length,
      }));

      return NextResponse.json({
        orders: formattedOrders,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      });
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      return NextResponse.json(
        { error: 'Erro ao listar pedidos. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Criar um novo pedido a partir do carrinho
export async function POST(req: NextRequest) {
  return authMiddleware(req, async (req, user) => {
    try {
      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { addressId, notes } = body;

      // Validar dados
      if (!addressId) {
        return NextResponse.json(
          { error: 'Endereço de entrega é obrigatório.' },
          { status: 400 }
        );
      }

      // Verificar se o endereço existe e pertence ao usuário
      const address = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId: user.id,
        },
      });

      if (!address) {
        return NextResponse.json(
          { error: 'Endereço não encontrado.' },
          { status: 404 }
        );
      }

      // Buscar o carrinho do usuário
      const cart = await prisma.cart.findFirst({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { error: 'Carrinho vazio. Adicione produtos antes de finalizar o pedido.' },
          { status: 400 }
        );
      }

      // Verificar estoque dos produtos
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `Produto "${item.product.name}" não possui estoque suficiente. Disponível: ${item.product.stock}, Solicitado: ${item.quantity}.`,
            },
            { status: 400 }
          );
        }
      }

      // Calcular o total do pedido
      let subtotal = 0;
      for (const item of cart.items) {
        subtotal += parseFloat(item.product.price.toString()) * item.quantity;
      }

      // Definir custo de envio (em um sistema real, isso seria calculado com base no endereço e peso)
      const shippingCost = 0; // Frete grátis para este exemplo

      // Gerar número do pedido
      const orderCount = await prisma.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${(orderCount + 1).toString().padStart(4, '0')}`;

      // Criar o pedido
      const order = await prisma.order.create({
        data: {
          orderNumber,
          status: 'PENDING',
          total: subtotal + shippingCost,
          shippingCost,
          notes,
          userId: user.id,
          addressId,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
      });

      // Atualizar o estoque dos produtos em uma única transação
      await prisma.$transaction(
        cart.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            },
          })
        )
      );

      // Limpar o carrinho
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return NextResponse.json(
        {
          message: 'Pedido criado com sucesso.',
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            total: order.total,
            shippingCost: order.shippingCost,
            notes: order.notes,
            createdAt: order.createdAt,
            items: order.items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              product: {
                id: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
              },
              subtotal: parseFloat(item.price.toString()) * item.quantity,
            })),
            address: {
              street: order.address.street,
              number: order.address.number,
              complement: order.address.complement,
              district: order.address.district,
              city: order.address.city,
              state: order.address.state,
              zipCode: order.address.zipCode,
            },
            itemCount: order.items.length,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      return NextResponse.json(
        { error: 'Erro ao criar pedido. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

