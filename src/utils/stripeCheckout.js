const Stripe = require("stripe");
const env = require("../config/env");

const PRODUCTS = {
  diagnostic: {
    product: "diagnostic",
    amountUsd: 25,
    label: "Spanish diagnostic assessment",
    mode: "payment",
  },
  membership: {
    product: "membership",
    amountUsd: 100,
    label: "Spanish Academy membership",
    mode: "subscription",
  },
};

function isConfigured() {
  return Boolean(env.stripe.secretKey && env.stripe.publishableKey);
}

function client() {
  if (!env.stripe.secretKey) return null;
  return new Stripe(env.stripe.secretKey);
}

async function createEmbeddedSession({ productKey, user }) {
  const catalog = PRODUCTS[productKey];
  const stripe = client();
  if (!catalog || !stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: catalog.mode,
    ui_mode: "embedded_page",
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { userId: user.id, product: catalog.product },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: catalog.amountUsd * 100,
          product_data: { name: `Skillbridge ${catalog.label}` },
          ...(catalog.mode === "subscription" ? { recurring: { interval: "month" } } : {}),
        },
      },
    ],
    return_url: `${env.frontendOrigin}/spanish/assessment?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  });

  return {
    sessionId: session.id,
    clientSecret: session.client_secret,
    publishableKey: env.stripe.publishableKey,
  };
}

function paidSession(session) {
  if (!session) return false;
  return session.status === "complete" || session.payment_status === "paid";
}

async function retrieveSession(sessionId) {
  const stripe = client();
  if (!stripe || !sessionId) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}

function constructWebhookEvent(rawBody, signature) {
  const stripe = client();
  if (!stripe || !env.stripe.webhookSecret) {
    throw new Error("Stripe webhook is not configured.");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
}

module.exports = {
  PRODUCTS,
  isConfigured,
  createEmbeddedSession,
  paidSession,
  retrieveSession,
  constructWebhookEvent,
};
