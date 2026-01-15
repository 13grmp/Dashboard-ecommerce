import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth/middleware';
import { retrieveCheckoutSession } from '@/lib/stripe';

// Verificar o status de um pagamento
export async function GET(
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
          payment: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se existe um pagamento para este pedido
      if (!order.payment) {
        return NextResponse.json(
          { error: 'Nenhum pagamento encontrado para este pedido.' },
          { status: 404 }
        );
      }

      // Extrair o ID da sessão do Stripe
      const stripeSessionId = order.payment.externalId;
      if (!stripeSessionId) {
        return NextResponse.json(
          { error: 'ID da sessão do Stripe não encontrado.' },
          { status: 400 }
        );
      }

      // Recuperar a sessão do Stripe
      const session = await retrieveCheckoutSession(stripeSessionId);

      // Verificar o status do pagamento
      let paymentStatus = 'PENDING';
      if (session.payment_status === 'paid') {
        paymentStatus = 'PAID';
      } else if (session.status === 'expired' || session.status === 'canceled') {
        paymentStatus = 'FAILED';
      }

      // Atualizar o status do pagamento no banco de dados
      if (paymentStatus !== order.payment.status) {
        await prisma.payment.update({
          where: { id: order.payment.id },
          data: {
            status: paymentStatus,
          },
        });

        // Se o pagamento foi confirmado, atualizar o status do pedido
        if (paymentStatus === 'PAID' && order.status === 'PROCESSING') {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PAID',
            },
          });
        }
      }

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: order.payment.id,
        paymentStatus,
        amount: order.payment.amount,
        paymentMethod: order.payment.paymentMethod,
        stripeSessionId,
        stripeSessionStatus: session.status,
        stripePaymentStatus: session.payment_status,
      });
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar status do pagamento. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

