import Stripe from 'stripe';

// Inicializar o cliente Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key', {
  apiVersion: '2023-10-16', // Usar a versão mais recente da API
});

/**
 * Criar uma sessão de checkout do Stripe
 */
export async function createCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    name: string;
    description?: string;
    amount: number; // em centavos
    quantity: number;
    imageUrl?: string;
  }>;
  shippingCost: number; // em centavos
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  try {
    const {
      orderId,
      orderNumber,
      customerId,
      customerEmail,
      customerName,
      items,
      shippingCost,
      successUrl,
      cancelUrl,
      metadata = {},
    } = params;

    // Criar a sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: customerId,
      line_items: items.map((item) => ({
        price_data: {
          currency: 'brl',
          product_data: {
            name: item.name,
            description: item.description,
            images: item.imageUrl ? [item.imageUrl] : undefined,
          },
          unit_amount: item.amount, // em centavos
        },
        quantity: item.quantity,
      })),
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: shippingCost, // em centavos
              currency: 'brl',
            },
            display_name: 'Frete padrão',
          },
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        orderId,
        orderNumber,
        ...metadata,
      },
    });

    return session;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout do Stripe:', error);
    throw error;
  }
}

/**
 * Recuperar uma sessão de checkout do Stripe
 */
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items'],
    });
    return session;
  } catch (error) {
    console.error('Erro ao recuperar sessão de checkout do Stripe:', error);
    throw error;
  }
}

/**
 * Verificar se um webhook do Stripe é válido
 */
export function constructWebhookEvent(payload: string, signature: string, webhookSecret: string) {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Erro ao verificar webhook do Stripe:', error);
    throw error;
  }
}

/**
 * Criar um cliente no Stripe
 */
export async function createCustomer(params: {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}) {
  try {
    const { email, name, phone, metadata = {} } = params;

    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata,
    });

    return customer;
  } catch (error) {
    console.error('Erro ao criar cliente no Stripe:', error);
    throw error;
  }
}

/**
 * Recuperar um cliente do Stripe
 */
export async function retrieveCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Erro ao recuperar cliente do Stripe:', error);
    throw error;
  }
}

/**
 * Criar um reembolso no Stripe
 */
export async function createRefund(params: {
  paymentIntentId: string;
  amount?: number; // em centavos
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}) {
  try {
    const { paymentIntentId, amount, reason, metadata = {} } = params;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
      metadata,
    });

    return refund;
  } catch (error) {
    console.error('Erro ao criar reembolso no Stripe:', error);
    throw error;
  }
}

