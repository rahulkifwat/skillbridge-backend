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

/**
 * Only same-site absolute paths may be used as a return destination. A bare
 * "/" prefix is not enough: "//evil.com" and "/\evil.com" are protocol-relative
 * and would send the customer off-site after paying.
 */
function safeReturnPath(value, fallback = "/spanish/assessment") {
  const path = String(value || "").trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  // Strip any query or hash; the Stripe params are appended by the caller.
  return path.split(/[?#]/)[0];
}

async function createEmbeddedSession({ productKey, user, returnTo }) {
  const catalog = PRODUCTS[productKey];
  const stripe = client();
  if (!catalog || !stripe) return null;
  const destination = safeReturnPath(returnTo);

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
    return_url: `${env.frontendOrigin}${destination}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
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
  safeReturnPath,
  isConfigured,
  createEmbeddedSession,
  paidSession,
  retrieveSession,
  constructWebhookEvent,
};
