const mongoose = require("mongoose");
const { SpanishPurchase } = require("./schemas");

const purchases = new Map();

function useMongo() {
  return mongoose.connection.readyState === 1;
}

function key(userId, product) {
  return `${userId}:${product}`;
}

function fromDoc(document) {
  if (!document) return null;
  const { _id, __v, ...rest } = document;
  return rest;
}

async function listForUser(userId) {
  if (useMongo()) {
    const documents = await SpanishPurchase.find({ userId, status: "paid" }).lean();
    return documents.map(fromDoc);
  }
  return [...purchases.values()].filter((row) => row.userId === userId && row.status === "paid");
}

async function entitlements(userId) {
  const rows = await listForUser(userId);
  const products = new Set(rows.map((row) => row.product));
  const membership = products.has("membership");
  return {
    diagnosticPaid: membership || products.has("diagnostic"),
    membershipPaid: membership,
    products: [...products],
  };
}

async function recordPurchase({ userId, product, amountUsd, stripeSessionId = null }) {
  const existing = (await listForUser(userId)).find((row) => row.product === product);
  if (existing) return existing;
  const record = {
    userId,
    product,
    amountUsd,
    status: "paid",
    paidAt: new Date().toISOString(),
    stripeSessionId,
  };
  if (useMongo()) {
    const created = await SpanishPurchase.create(record);
    return fromDoc(created.toObject());
  }
  purchases.set(key(userId, product), record);
  return record;
}

function resetStore() {
  purchases.clear();
}

module.exports = { listForUser, entitlements, recordPurchase, resetStore };
