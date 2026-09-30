(function () {
  "use strict";

  var config = window.ZWELI_CATERING_CONFIG;
  var calculator = window.CateringQuoteCalculator;
  var form = document.getElementById("catering-quote-form");
  if (!config || !calculator || !form) return;

  var steps = Array.from(document.querySelectorAll("[data-quote-step]"));
  var progressItems = Array.from(document.querySelectorAll("[data-progress-step]"));
  var currentStep = 1;
  var dirty = false;
  var latestResult = null;

  var eventType = document.getElementById("quote-event-type");
  var eventDate = document.getElementById("quote-event-date");
  var styleGrid = document.getElementById("service-style-grid");
  var extrasWrap = document.getElementById("quote-extras-wrap");
  var extrasGrid = document.getElementById("extras-grid");

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function initialiseOptions() {
    config.eventTypes.forEach(function (name) { eventType.appendChild(el("option", { value: name }, name)); });

    config.serviceStyles.forEach(function (style) {
      var label = el("label", { class: "quote-choice" });
      var input = el("input", { type: "radio", name: "serviceStyle", value: style.id, required: "required" });
      var copy = el("span", { class: "quote-choice-copy" });
      copy.appendChild(el("strong", {}, style.name));
      copy.appendChild(el("small", {}, style.description));
      copy.appendChild(el("em", {}, style.pricePerPerson === null ? "Price to be confirmed" : calculator.money(style.pricePerPerson, config.locale, config.currency) + " per person"));
      label.appendChild(input); label.appendChild(copy); styleGrid.appendChild(label);
    });

    if (config.extras.length) {
      config.extras.forEach(function (extra) {
        var label = el("label", { class: "quote-choice compact" });
        label.appendChild(el("input", { type: "checkbox", name: "extras", value: extra.id }));
        var suffix = extra.price === null ? "To be confirmed" : calculator.money(extra.price, config.locale, config.currency) + (extra.pricing === "perPerson" ? " per person" : "");
        label.appendChild(el("span", { class: "quote-choice-copy" }, extra.name + " — " + suffix));
        extrasGrid.appendChild(label);
      });
    } else {
      extrasWrap.hidden = true;
    }

    config.fulfilmentOptions.forEach(function (option) {
      var select = document.getElementById("quote-fulfilment");
      select.appendChild(el("option", { value: option.id }, option.name));
    });

    eventDate.min = localISODate(new Date());
  }

  function localISODate(date) {
    var offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }

  function value(name) {
    var input = form.elements[name];
    if (!input) return "";
    if (window.RadioNodeList && input instanceof window.RadioNodeList) return input.value;
    return input.value.trim();
  }

  function checkedValues(name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (input) { return input.value; });
  }

  function selection() {
    return { guests: value("guests"), serviceStyle: value("serviceStyle"), fulfilment: value("fulfilment"), extras: checkedValues("extras") };
  }

  function findById(list, id) {
    return (list || []).find(function (item) { return item.id === id; });
  }

  function setError(input, message) {
    var wrap = input.closest(".field, fieldset, .quote-choice-group");
    if (!wrap) return;
    wrap.classList.toggle("has-error", !!message);
    var error = wrap.querySelector(".error-text");
    if (error) error.textContent = message || "";
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateStep(stepNumber) {
    var panel = document.querySelector('[data-quote-step="' + stepNumber + '"]');
    var firstInvalid = null;
    panel.querySelectorAll("[data-required]").forEach(function (input) {
      var message = "";
      if (!input.value || !input.value.trim()) message = input.dataset.error || "Please complete this field.";
      if (input.name === "guests" && input.value && !calculator.validGuests(input.value)) message = "Enter a positive whole number of guests.";
      if (input.name === "eventDate" && input.value && input.value < eventDate.min) message = "Choose today or a future date.";
      setError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });

    var email = panel.querySelector('input[type="email"]');
    if (email && email.value && email.validity.typeMismatch) {
      setError(email, "Enter a valid email address or leave this field blank.");
      if (!firstInvalid) firstInvalid = email;
    } else if (email) {
      setError(email, "");
    }

    if (stepNumber === 2) {
      var chosenStyle = form.querySelector('input[name="serviceStyle"]:checked');
      var groupError = document.getElementById("service-style-error");
      styleGrid.classList.toggle("has-error", !chosenStyle);
      groupError.textContent = chosenStyle ? "" : "Choose the catering style closest to what you need.";
      if (!chosenStyle && !firstInvalid) firstInvalid = styleGrid.querySelector("input");
      var calc = calculator.calculate(config, selection());
      if (chosenStyle && calc.errors.length) {
        groupError.textContent = calc.errors.join(" ");
        firstInvalid = firstInvalid || styleGrid.querySelector("input:checked");
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      document.getElementById("quote-status").textContent = "Please fix the highlighted field before continuing.";
      return false;
    }
    document.getElementById("quote-status").textContent = "";
    return true;
  }

  function showStep(number, shouldScroll) {
    currentStep = number;
    steps.forEach(function (panel) {
      var active = Number(panel.dataset.quoteStep) === number;
      panel.hidden = !active;
    });
    progressItems.forEach(function (item) {
      var itemStep = Number(item.dataset.progressStep);
      item.classList.toggle("is-active", itemStep === number);
      item.classList.toggle("is-complete", itemStep < number);
      if (itemStep === number) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
    });
    if (shouldScroll !== false) {
      var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("quote-tool").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }

  function renderLiveSummary() {
    var result = calculator.calculate(config, selection());
    var style = findById(config.serviceStyles, value("serviceStyle"));
    document.getElementById("live-guests").textContent = calculator.validGuests(value("guests")) ? value("guests") : "—";
    document.getElementById("live-selection").textContent = style ? style.name : "Not selected";
    document.getElementById("live-total").textContent = result.total === null ? "To be confirmed" : calculator.money(result.total, config.locale, config.currency);
    document.getElementById("live-charge-note").textContent = result.hasUnknown ? "Unconfirmed menu and service charges are excluded from any displayed amount." : "All configured charges are included.";
  }

  function addSummaryRow(parent, label, content) {
    var row = el("div", { class: "quote-review-row" });
    row.appendChild(el("dt", {}, label));
    row.appendChild(el("dd", {}, content || "Not provided"));
    parent.appendChild(row);
  }

  function buildReview() {
    latestResult = calculator.calculate(config, selection());
    var style = findById(config.serviceStyles, value("serviceStyle"));
    var fulfilment = findById(config.fulfilmentOptions, value("fulfilment"));
    var dietary = checkedValues("dietary");
    var details = document.getElementById("quote-review-details");
    var items = document.getElementById("quote-review-items");
    details.innerHTML = ""; items.innerHTML = "";

    addSummaryRow(details, "Event", value("eventType"));
    addSummaryRow(details, "Date", value("eventDate"));
    addSummaryRow(details, "Guests", value("guests"));
    addSummaryRow(details, "Location", value("location"));
    addSummaryRow(details, "Service request", fulfilment ? fulfilment.name : "Not provided");
    addSummaryRow(details, "Customer", value("fullName"));
    addSummaryRow(details, "Phone", value("phone"));
    addSummaryRow(details, "Email", value("email") || "Not provided");

    latestResult.lines.forEach(function (line) {
      var li = el("li");
      li.appendChild(el("span", {}, line.label));
      li.appendChild(el("strong", {}, line.amount === null ? "To be confirmed" : calculator.money(line.amount, config.locale, config.currency)));
      items.appendChild(li);
    });

    document.getElementById("review-menu-notes").textContent = value("menuNotes") || (style ? style.description : "Not provided");
    document.getElementById("review-dietary").textContent = (dietary.length ? dietary.join(", ") : "None selected") + (value("dietaryNotes") ? ". " + value("dietaryNotes") : "");
    document.getElementById("review-requests").textContent = value("additionalRequests") || "None provided";
    document.getElementById("review-total").textContent = latestResult.total === null ? "To be confirmed" : calculator.money(latestResult.total, config.locale, config.currency);
    document.getElementById("review-excluded").hidden = !latestResult.hasUnknown;
    populatePrintSheet(style, fulfilment, dietary);
  }

  function messageText() {
    var style = findById(config.serviceStyles, value("serviceStyle"));
    var fulfilment = findById(config.fulfilmentOptions, value("fulfilment"));
    var dietary = checkedValues("dietary");
    var lines = [
      "Catering quote request — Zwelicious Food",
      "",
      "CUSTOMER",
      "Name: " + value("fullName"),
      "Phone: " + value("phone"),
      "Email: " + (value("email") || "Not provided"),
      "",
      "EVENT",
      "Event type: " + value("eventType"),
      "Date: " + value("eventDate"),
      "Guests: " + value("guests"),
      "Location: " + value("location"),
      "Service request: " + (fulfilment ? fulfilment.name : "Not provided"),
      "",
      "CATERING",
      "Requested style: " + (style ? style.name : "Not selected"),
      "Menu preferences: " + (value("menuNotes") || "Not provided"),
      "Dietary requirements: " + (dietary.length ? dietary.join(", ") : "None selected"),
      "Dietary details: " + (value("dietaryNotes") || "None"),
      "Additional requests: " + (value("additionalRequests") || "None"),
      "",
      "ESTIMATED CATERING QUOTE: " + (latestResult && latestResult.total !== null ? calculator.money(latestResult.total, config.locale, config.currency) : "To be confirmed"),
      "Unconfirmed menu, service and delivery charges are excluded.",
      "",
      "This is a quote request only. Final pricing and availability must be confirmed by Zwelicious Food. The event is not booked by submitting this request."
    ];
    return lines.join("\n");
  }

  function populatePrintSheet(style, fulfilment, dietary) {
    var sheet = document.getElementById("quote-print-sheet");
    sheet.querySelector("[data-print-customer]").textContent = value("fullName") + " · " + value("phone") + (value("email") ? " · " + value("email") : "");
    sheet.querySelector("[data-print-event]").textContent = value("eventType") + " on " + value("eventDate") + " · " + value("guests") + " guests · " + value("location");
    sheet.querySelector("[data-print-service]").textContent = (style ? style.name : "Not selected") + " · " + (fulfilment ? fulfilment.name : "Not provided");
    sheet.querySelector("[data-print-menu]").textContent = value("menuNotes") || "Menu to be discussed";
    sheet.querySelector("[data-print-dietary]").textContent = (dietary.length ? dietary.join(", ") : "None selected") + (value("dietaryNotes") ? " — " + value("dietaryNotes") : "");
    sheet.querySelector("[data-print-requests]").textContent = value("additionalRequests") || "None provided";
    sheet.querySelector("[data-print-total]").textContent = latestResult && latestResult.total !== null ? calculator.money(latestResult.total, config.locale, config.currency) : "To be confirmed";
    sheet.querySelector("[data-print-date]").textContent = new Intl.DateTimeFormat("en-ZA", { dateStyle: "long" }).format(new Date());
  }

  function handleFormChange() {
    dirty = true;
    renderLiveSummary();
    if (currentStep === 3) buildReview();
  }

  form.addEventListener("input", handleFormChange);
  form.addEventListener("change", handleFormChange);

  document.querySelectorAll("[data-next-step]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (!validateStep(currentStep)) return;
      var next = Number(button.dataset.nextStep);
      if (next === 3) buildReview();
      showStep(next);
    });
  });
  document.querySelectorAll("[data-prev-step]").forEach(function (button) {
    button.addEventListener("click", function () { showStep(Number(button.dataset.prevStep)); });
  });

  document.getElementById("send-whatsapp").addEventListener("click", function (event) {
    if (!validateStep(3)) { event.preventDefault(); return; }
    buildReview();
    var cfg = window.ZWELI_CONFIG || {};
    if (!cfg.whatsappNumber) { event.preventDefault(); document.getElementById("quote-status").textContent = "The business WhatsApp number is not configured."; return; }
    event.currentTarget.href = "https://wa.me/" + cfg.whatsappNumber + "?text=" + encodeURIComponent(messageText());
  });

  document.getElementById("print-quote").addEventListener("click", function () {
    if (!validateStep(3)) return;
    buildReview();
    window.print();
  });
  document.getElementById("start-again").addEventListener("click", function () {
    if (dirty && !window.confirm("Start again and clear all the information you entered?")) return;
    form.reset(); dirty = false; latestResult = null; renderLiveSummary(); showStep(1);
  });

  initialiseOptions();
  renderLiveSummary();
  showStep(1, false);
})();
