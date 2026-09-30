"use strict";

const assert = require("node:assert/strict");
const calculator = require("../catering-calculator.js");

assert.equal(calculator.validGuests(1), true);
assert.equal(calculator.validGuests("80"), true);
assert.equal(calculator.validGuests(0), false);
assert.equal(calculator.validGuests(-3), false);
assert.equal(calculator.validGuests(2.5), false);

const pricedConfig = {
  locale: "en-ZA",
  currency: "ZAR",
  serviceStyles: [{ id: "buffet", name: "Buffet", pricePerPerson: 150, minimumGuests: 5 }],
  extras: [
    { id: "staff", name: "Service staff", pricing: "fixed", price: 200 },
    { id: "dessert", name: "Dessert", pricing: "perPerson", price: 10 }
  ],
  fulfilmentOptions: [{ id: "delivery", name: "Delivery", charge: 100 }],
  pricingRules: { minimumGuests: null, minimumOrderValue: null }
};

const priced = calculator.calculate(pricedConfig, {
  guests: 10,
  serviceStyle: "buffet",
  extras: ["staff", "dessert"],
  fulfilment: "delivery"
});
assert.equal(priced.valid, true);
assert.equal(priced.total, 1900);
assert.equal(priced.knownSubtotal, 1900);
assert.equal(priced.hasUnknown, false);

const tooSmall = calculator.calculate(pricedConfig, {
  guests: 4,
  serviceStyle: "buffet",
  extras: [],
  fulfilment: "delivery"
});
assert.equal(tooSmall.valid, false);
assert.match(tooSmall.errors.join(" "), /at least 5 guests/);

const requestConfig = {
  locale: "en-ZA",
  currency: "ZAR",
  serviceStyles: [{ id: "custom", name: "Custom", pricePerPerson: null, minimumGuests: null }],
  extras: [],
  fulfilmentOptions: [{ id: "delivery", name: "Delivery", charge: null }],
  pricingRules: {}
};
const request = calculator.calculate(requestConfig, {
  guests: 25,
  serviceStyle: "custom",
  extras: [],
  fulfilment: "delivery"
});
assert.equal(request.total, null);
assert.equal(request.hasUnknown, true);
assert.equal(request.lines.length, 2);
assert.ok(request.lines.every((line) => line.amount === null));

const invalid = calculator.calculate(pricedConfig, {
  guests: "1.5",
  serviceStyle: "buffet",
  extras: [],
  fulfilment: "delivery"
});
assert.equal(invalid.valid, false);
assert.equal(invalid.total, null);

const deliveryRuleConfig = JSON.parse(JSON.stringify(pricedConfig));
deliveryRuleConfig.fulfilmentOptions[0].charge = null;
deliveryRuleConfig.pricingRules.deliveryCharge = 75;
const deliveryRule = calculator.calculate(deliveryRuleConfig, {
  guests: 10,
  serviceStyle: "buffet",
  extras: [],
  fulfilment: "delivery"
});
assert.equal(deliveryRule.total, 1575);

assert.match(calculator.money(1234.5, "en-ZA", "ZAR"), /1.?234,50/);
console.log("Catering calculator tests passed.");
