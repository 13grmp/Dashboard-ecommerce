import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';
import { createCheckoutSession } from '@/lib/stripe';

// Criar uma sessão de checkout do Stripe para um pedido
export async function POST(
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
          user: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o pedido já foi pago
      if (order.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Este pedido não está pendente de pagamento.' },
          { status: 400 }
        );
      }

      // Verificar se já existe um pagamento para este pedido
      const existingPayment = await prisma.payment.findFirst({
        where: { orderId },
      });

      if (existingPayment && existingPayment.status === 'PAID') {
        return NextResponse.json(
          { error: 'Este pedido já foi pago.' },
          { status: 400 }
        );
      }

      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { successUrl, cancelUrl } = body;

      if (!successUrl || !cancelUrl) {
        return NextResponse.json(
          { error: 'URLs de sucesso e cancelamento são obrigatórias.' },
          { status: 400 }
        );
      }

      // Preparar itens para o Stripe
      const items = order.items.map((item:any) => ({
        name: item.product.name,
        description: item.product.description,
        amount: Math.round(parseFloat(item.price.toString()) * 100), // Converter para centavos
        quantity: item.quantity,
        imageUrl: item.product.images.length > 0 ? `${req.nextUrl.origin}${item.product.images[0].url}` : undefined,
      }));

      // Criar sessão de checkout
      const session = await createCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerId: user.id,
        customerEmail: order.user.email,
        customerName: order.user.name,
        items,
        shippingCost: Math.round(parseFloat(order.shippingCost.toString()) * 100), // Converter para centavos
        successUrl,
        cancelUrl,
        metadata: {
          userId: user.id,
        },
      });

      // Criar ou atualizar o registro de pagamento
      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: order.total,
            paymentMethod: 'CREDIT_CARD',
            status: 'PENDING',
            externalId: session.id,
            metadata: {
              stripeSessionId: session.id,
            },
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            amount: order.total,
            paymentMethod: 'CREDIT_CARD',
            status: 'PENDING',
            externalId: session.id,
            metadata: {
              stripeSessionId: session.id,
            },
          },
        });
      }

      // Atualizar o status do pedido
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
        },
      });

      return NextResponse.json({
        message: 'Sessão de checkout criada com sucesso.',
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      return NextResponse.json(
        { error: 'Erro ao criar sessão de checkout. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

