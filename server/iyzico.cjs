/**
 * iyzico CommonJS wrapper — bridges the CJS iyzipay package into ESM server.ts
 */
const Iyzipay = require('iyzipay');

function createClient(options) {
  return new Iyzipay(options);
}

/** Initialize iyzico Checkout Form — returns form token + content */
async function createCheckoutForm(client, request) {
  return new Promise((resolve, reject) => {
    client.checkoutFormCreate.initialize(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Retrieve checkout form payment status */
async function retrieveCheckoutForm(client, request) {
  return new Promise((resolve, reject) => {
    client.checkoutFormCreate.retrieve(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Get installment options for a given BIN / amount */
async function getInstallmentOptions(client, request) {
  return new Promise((resolve, reject) => {
    client.installmentInfo.retrieve(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ─── Marketplace Resources ───────────────────────────────────────────────────

/** Create a sub-merchant on iyzico marketplace */
async function subMerchantCreate(client, request) {
  return new Promise((resolve, reject) => {
    client.subMerchant.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Update an existing sub-merchant */
async function subMerchantUpdate(client, request) {
  return new Promise((resolve, reject) => {
    client.subMerchant.update(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Retrieve a sub-merchant by subMerchantExternalId */
async function subMerchantRetrieve(client, request) {
  return new Promise((resolve, reject) => {
    client.subMerchant.retrieve(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Approve a payment transaction (marketplace payout release) */
async function approvalCreate(client, request) {
  return new Promise((resolve, reject) => {
    client.approval.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Disapprove a payment transaction */
async function disapprovalCreate(client, request) {
  return new Promise((resolve, reject) => {
    client.disapproval.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Refund a specific payment transaction (v2 per-item refund) */
async function refundV2Create(client, request) {
  return new Promise((resolve, reject) => {
    client.refundV2.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Cancel an entire payment */
async function cancelCreate(client, request) {
  return new Promise((resolve, reject) => {
    client.cancel.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Transfer marketplace balance to sub-merchant */
async function settlementToBalance(client, request) {
  return new Promise((resolve, reject) => {
    client.settlementToBalance.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/** Cross-booking transfer to sub-merchant */
async function crossBookingToSubMerchant(client, request) {
  return new Promise((resolve, reject) => {
    client.crossBookingToSubMerchant.create(request, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

module.exports = {
  createClient,
  createCheckoutForm,
  retrieveCheckoutForm,
  getInstallmentOptions,
  subMerchantCreate,
  subMerchantUpdate,
  subMerchantRetrieve,
  approvalCreate,
  disapprovalCreate,
  refundV2Create,
  cancelCreate,
  settlementToBalance,
  crossBookingToSubMerchant,
};
