import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware, adminMiddleware } from '@/lib/auth/middleware';

// Obter detalhes de um pedido específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const orderId = params.id;

      // Verificar se o pedido existe e pertence ao usuário (ou é admin)
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isMain: true },
                    take: 1,
                  },
                  brand: true,
                },
              },
            },
          },
          payment: true,
          address: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o usuário tem permissão para ver este pedido
      if (order.userId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Você não tem permissão para acessar este pedido.' },
          { status: 403 }
        );
      }

      // Formatar a resposta
      const formattedOrder = {
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
            slug: item.product.slug,
            brand: item.product.brand ? item.product.brand.name : null,
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
          updatedAt: order.payment.updatedAt,
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
        user: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
        },
        itemCount: order.items.length,
      };

      return NextResponse.json(formattedOrder);
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes do pedido. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Atualizar o status de um pedido (apenas admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const orderId = params.id;
      const body = await req.json();
      const { status, notes } = body;

      // Validar dados
      if (!status) {
        return NextResponse.json(
          { error: 'Status é obrigatório.' },
          { status: 400 }
        );
      }

      // Verificar se o status é válido
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido.' },
          { status: 400 }
        );
      }

      // Verificar se o pedido existe
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado.' },
          { status: 404 }
        );
      }

      // Se o pedido estiver sendo cancelado, devolver os produtos ao estoque
      if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Atualizar o pedido
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          notes: notes !== undefined ? notes : order.notes,
        },
      });

      return NextResponse.json({
        message: 'Status do pedido atualizado com sucesso.',
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          notes: updatedOrder.notes,
          updatedAt: updatedOrder.updatedAt,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status do pedido. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

// Cancelar um pedido (usuário só pode cancelar pedidos pendentes)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware(req, async (req, user) => {
    try {
      const orderId = params.id;

      // Verificar se o pedido existe e pertence ao usuário
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: user.id,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o pedido pode ser cancelado (apenas pedidos pendentes)
      if (user.role !== 'ADMIN' && order.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Apenas pedidos pendentes podem ser cancelados pelo usuário.' },
          { status: 400 }
        );
      }

      // Devolver os produtos ao estoque
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Atualizar o status do pedido para cancelado
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
        },
      });

      return NextResponse.json({
        message: 'Pedido cancelado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      return NextResponse.json(
        { error: 'Erro ao cancelar pedido. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

