/* Pure pricing functions shared by the page and automated checks. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.CateringQuoteCalculator = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function validGuests(value) {
    var n = Number(value);
    return Number.isInteger(n) && n > 0;
  }

  function money(value, locale, currency) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "To be confirmed";
    return new Intl.NumberFormat(locale || "en-ZA", {
      style: "currency",
      currency: currency || "ZAR",
      minimumFractionDigits: 2
    }).format(Number(value));
  }

  function calculate(config, selection) {
    var guests = Number(selection.guests);
    var style = (config.serviceStyles || []).find(function (item) { return item.id === selection.serviceStyle; }) || null;
    var fulfilment = (config.fulfilmentOptions || []).find(function (item) { return item.id === selection.fulfilment; }) || null;
    var lines = [];
    var knownTotal = 0;
    var hasUnknown = false;
    var rules = config.pricingRules || {};

    if (!validGuests(guests)) return { valid: false, lines: [], total: null, hasUnknown: true, errors: ["Guest count must be a positive whole number."] };

    if (style) {
      if (Number.isFinite(style.pricePerPerson)) {
        var packageTotal = style.pricePerPerson * guests;
        knownTotal += packageTotal;
        lines.push({ label: style.name + " × " + guests + " guests", amount: packageTotal, confirmed: true });
      } else {
        hasUnknown = true;
        lines.push({ label: style.name + " × " + guests + " guests", amount: null, confirmed: false });
      }
    }

    (selection.extras || []).forEach(function (extraId) {
      var extra = (config.extras || []).find(function (item) { return item.id === extraId; });
      if (!extra) return;
      var amount = null;
      if (Number.isFinite(extra.price)) amount = extra.pricing === "perPerson" ? extra.price * guests : extra.price;
      if (amount === null) hasUnknown = true;
      else knownTotal += amount;
      lines.push({ label: extra.name + (extra.pricing === "perPerson" ? " × " + guests + " guests" : ""), amount: amount, confirmed: amount !== null });
    });

    if (fulfilment) {
      var fulfilmentCharge = fulfilment.id === "delivery" && Number.isFinite(rules.deliveryCharge) ? rules.deliveryCharge : fulfilment.charge;
      if (Number.isFinite(fulfilmentCharge)) {
        knownTotal += fulfilmentCharge;
        lines.push({ label: fulfilment.name, amount: fulfilmentCharge, confirmed: true });
      } else {
        hasUnknown = true;
        lines.push({ label: fulfilment.name, amount: null, confirmed: false });
      }
    }

    var errors = [];
    var minimumGuests = style && Number.isInteger(style.minimumGuests) ? style.minimumGuests : rules.minimumGuests;
    if (Number.isInteger(minimumGuests) && guests < minimumGuests) errors.push("This selection requires at least " + minimumGuests + " guests.");
    if (Number.isFinite(rules.minimumOrderValue) && !hasUnknown && knownTotal < rules.minimumOrderValue) {
      errors.push("The confirmed minimum order value is " + money(rules.minimumOrderValue, config.locale, config.currency) + ".");
    }

    return {
      valid: errors.length === 0,
      lines: lines,
      knownSubtotal: knownTotal,
      total: hasUnknown ? null : knownTotal,
      hasUnknown: hasUnknown,
      errors: errors
    };
  }

  return { validGuests: validGuests, money: money, calculate: calculate };
});
