/* =========================================================
   Zwelicious Food — catering quotation configuration

   This is the only file that should be edited when approved
   menus, prices, extras or pricing rules change.

   IMPORTANT: null means "not confirmed". Never replace null
   with 0 unless the business has confirmed that the item is free.
   ========================================================= */

window.ZWELI_CATERING_CONFIG = {
  currency: "ZAR",
  locale: "en-ZA",
  quoteMode: "request",

  notice: "Menus, prices, delivery charges and availability are confirmed personally after the request is reviewed.",

  eventTypes: [
    "Wedding",
    "Funeral",
    "Private event",
    "Corporate event",
    "Birthday",
    "Other"
  ],

  /* These are enquiry categories already shown on the food page.
     They are not confirmed packages and therefore have no price. */
  serviceStyles: [
    { id: "buffet", name: "Buffet service", description: "A self-service style request for a larger gathering.", pricePerPerson: null, minimumGuests: null },
    { id: "plated", name: "Plated meals", description: "An individually served meal request for a seated event.", pricePerPerson: null, minimumGuests: null },
    { id: "wedding", name: "Wedding catering", description: "Catering requirements for a wedding celebration.", pricePerPerson: null, minimumGuests: null },
    { id: "funeral", name: "Funeral catering", description: "A respectful catering request for a funeral gathering.", pricePerPerson: null, minimumGuests: null },
    { id: "function", name: "Corporate or private function", description: "A catering request for an office or private function.", pricePerPerson: null, minimumGuests: null },
    { id: "custom", name: "Custom catering request", description: "Describe the food and service you need and the team will prepare a quotation.", pricePerPerson: null, minimumGuests: null }
  ],

  /* Add approved extras here, for example:
     { id: "example", name: "Example extra", pricing: "fixed", price: 250 }
     pricing can be "fixed" or "perPerson". */
  extras: [],

  fulfilmentOptions: [
    { id: "onsite", name: "On-site catering / service requested", charge: null },
    { id: "delivery", name: "Delivery requested", charge: null },
    { id: "collection", name: "Collection requested", charge: null },
    { id: "unsure", name: "Not sure — please advise", charge: null }
  ],

  pricingRules: {
    minimumGuests: null,
    minimumOrderValue: null,
    deliveryCharge: null,
    vatIncluded: null,
    depositPercentage: null
  }
};

