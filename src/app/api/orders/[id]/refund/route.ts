import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminMiddleware } from '@/lib/auth/middleware';
import { createRefund } from '@/lib/stripe';

// Solicitar reembolso de um pagamento (apenas admin)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return adminMiddleware(req, async (req, user) => {
    try {
      const orderId = params.id;

      // Verificar se o pedido existe
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payment: true,
          items: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido não encontrado.' },
          { status: 404 }
        );
      }

      // Verificar se o pedido tem um pagamento
      if (!order.payment) {
        return NextResponse.json(
          { error: 'Nenhum pagamento encontrado para este pedido.' },
          { status: 404 }
        );
      }

      // Verificar se o pagamento foi confirmado
      if (order.payment.status !== 'PAID') {
        return NextResponse.json(
          { error: 'Apenas pagamentos confirmados podem ser reembolsados.' },
          { status: 400 }
        );
      }

      // Extrair dados do corpo da requisição
      const body = await req.json();
      const { reason, amount } = body;

      // Verificar se o pagamento tem o ID do PaymentIntent
      const paymentIntentId = order.payment.metadata?.stripePaymentIntentId;
      if (!paymentIntentId) {
        return NextResponse.json(
          { error: 'ID do PaymentIntent não encontrado.' },
          { status: 400 }
        );
      }

      // Calcular o valor do reembolso em centavos
      const refundAmount = amount
        ? Math.round(parseFloat(amount) * 100)
        : Math.round(parseFloat(order.payment.amount.toString()) * 100);

      // Criar o reembolso no Stripe
      const refund = await createRefund({
        paymentIntentId,
        amount: refundAmount,
        reason: reason || 'requested_by_customer',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: user.id,
        },
      });

      // Atualizar o status do pagamento
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...order.payment.metadata,
            refundId: refund.id,
            refundAmount: refundAmount.toString(),
            refundReason: reason || 'requested_by_customer',
          },
        },
      });

      // Atualizar o status do pedido
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          notes: order.notes
            ? `${order.notes}\nReembolsado em ${new Date().toISOString()}. Motivo: ${reason || 'Solicitado pelo cliente'}.`
            : `Reembolsado em ${new Date().toISOString()}. Motivo: ${reason || 'Solicitado pelo cliente'}.`,
        },
      });

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

      return NextResponse.json({
        message: 'Reembolso solicitado com sucesso.',
        refundId: refund.id,
        amount: refundAmount / 100, // Converter de centavos para reais
        status: refund.status,
      });
    } catch (error) {
      console.error('Erro ao solicitar reembolso:', error);
      return NextResponse.json(
        { error: 'Erro ao solicitar reembolso. Tente novamente mais tarde.' },
        { status: 500 }
      );
    }
  });
}

