import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent } from '@/lib/stripe';

// Processar webhooks do Stripe
export async function POST(req: NextRequest) {
  try {
    // Obter a assinatura do webhook
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Assinatura do webhook não fornecida.' },
        { status: 400 }
      );
    }

    // Obter o segredo do webhook
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não configurado');
      return NextResponse.json(
        { error: 'Configuração do webhook não encontrada.' },
        { status: 500 }
      );
    }

    // Obter o corpo da requisição como texto
    const payload = await req.text();

    // Verificar a assinatura e construir o evento
    const event = constructWebhookEvent(payload, signature, webhookSecret);

    // Processar o evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Obter o ID do pedido dos metadados
        const orderId = session.metadata?.orderId;
        if (!orderId) {
          console.error('ID do pedido não encontrado nos metadados da sessão');
          return NextResponse.json(
            { error: 'ID do pedido não encontrado.' },
            { status: 400 }
          );
        }

        // Atualizar o pagamento
        await prisma.payment.updateMany({
          where: {
            externalId: session.id,
          },
          data: {
            status: 'PAID',
            metadata: {
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              stripeCustomerId: session.customer,
            },
          },
        });

        // Atualizar o status do pedido
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
          },
        });

        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        
        // Obter o ID do pedido dos metadados
        const orderId = session.metadata?.orderId;
        if (!orderId) {
          console.error('ID do pedido não encontrado nos metadados da sessão');
          return NextResponse.json(
            { error: 'ID do pedido não encontrado.' },
            { status: 400 }
          );
        }

        // Atualizar o pagamento
        await prisma.payment.updateMany({
          where: {
            externalId: session.id,
          },
          data: {
            status: 'FAILED',
          },
        });

        // Atualizar o status do pedido para pendente novamente
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PENDING',
          },
        });

        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Buscar o pagamento pelo ID do PaymentIntent
        const payment = await prisma.payment.findFirst({
          where: {
            metadata: {
              path: ['stripePaymentIntentId'],
              equals: paymentIntent.id,
            },
          },
          include: {
            order: true,
          },
        });

        if (payment) {
          // Atualizar o status do pagamento
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
            },
          });

          // Atualizar o status do pedido
          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'PENDING',
            },
          });
        }

        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        
        // Buscar o pagamento pelo ID do PaymentIntent
        const payment = await prisma.payment.findFirst({
          where: {
            metadata: {
              path: ['stripePaymentIntentId'],
              equals: charge.payment_intent,
            },
          },
          include: {
            order: true,
          },
        });

        if (payment) {
          // Atualizar o status do pagamento
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'REFUNDED',
            },
          });

          // Atualizar o status do pedido
          await prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'CANCELLED',
            },
          });

          // Devolver os produtos ao estoque
          const orderItems = await prisma.orderItem.findMany({
            where: { orderId: payment.orderId },
            include: {
              product: true,
            },
          });

          for (const item of orderItems) {
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

        break;
      }
      default:
        console.log(`Evento não processado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook do Stripe:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook.' },
      { status: 500 }
    );
  }
}

