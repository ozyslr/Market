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

module.exports = { createClient, createCheckoutForm, retrieveCheckoutForm, getInstallmentOptions };
