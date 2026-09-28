/* =========================================================
   Zweli Group — shared site behaviour
   1. Mobile navigation toggle
   2. Footer year + WhatsApp display number
   3. Reusable enquiry-form handling (validate -> summarise -> WhatsApp)
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    var header = document.querySelector(".site-header");
    if (!toggle || !links) return;

    // Keep the mobile menu's top edge pinned exactly below the header,
    // even if the draft banner above it wraps onto a second line.
    function syncHeaderHeight() {
      if (!header) return;
      var h = header.getBoundingClientRect().bottom;
      document.documentElement.style.setProperty("--header-h", h + "px");
    }
    syncHeaderHeight();
    window.addEventListener("resize", syncHeaderHeight);
    window.addEventListener("orientationchange", syncHeaderHeight);

    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  /* ---------- Footer helpers ---------- */
  function initFooter() {
    var yearEl = document.querySelector("[data-current-year]");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var cfg = window.ZWELI_CONFIG || {};
    document.querySelectorAll("[data-whatsapp-display]").forEach(function (el) {
      el.textContent = cfg.whatsappDisplay || "";
    });
    document.querySelectorAll("[data-whatsapp-href]").forEach(function (el) {
      if (cfg.whatsappNumber) el.setAttribute("href", "https://wa.me/" + cfg.whatsappNumber);
    });
    document.querySelectorAll("[data-email-display]").forEach(function (el) {
      el.textContent = cfg.contactEmail || "";
    });
    document.querySelectorAll("[data-email-href]").forEach(function (el) {
      if (cfg.contactEmail) el.setAttribute("href", "mailto:" + cfg.contactEmail);
    });
    document.querySelectorAll("[data-group-name]").forEach(function (el) {
      el.textContent = cfg.groupName || "Zweli Group";
    });
  }

  /* ---------- Reusable enquiry form controller ---------- */
  // options = {
  //   formId: "food-form",
  //   modalId: "food-summary-modal",
  //   fields: [{ name, label, required, type: 'text'|'select'|'checkboxGroup'|'textarea', minChecked }],
  //   buildMessage: function(values){ return "plain text lines"; },
  //   heading: "Review your catering enquiry"
  // }
  function ZweliForm(options) {
    this.opts = options;
    this.form = document.getElementById(options.formId);
    this.modal = document.getElementById(options.modalId);
    if (!this.form || !this.modal) return;
    this.bind();
  }

  ZweliForm.prototype.bind = function () {
    var self = this;

    this.form.addEventListener("submit", function (e) {
      e.preventDefault();
      var result = self.validate();
      if (!result.valid) {
        var firstError = self.form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstError) firstError.focus();
        self.setStatus("Please fix the highlighted fields before continuing.");
        return;
      }
      self.setStatus("");
      self.openSummary(result.values);
    });

    var closeBtn = this.modal.querySelector(".modal-close");
    var backBtn = this.modal.querySelector("[data-modal-back]");
    if (closeBtn) closeBtn.addEventListener("click", function () { self.closeSummary(); });
    if (backBtn) backBtn.addEventListener("click", function () { self.closeSummary(); });
    this.modal.addEventListener("click", function (e) {
      if (e.target === self.modal) self.closeSummary();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && self.modal.classList.contains("is-open")) self.closeSummary();
    });
  };

  ZweliForm.prototype.setStatus = function (msg) {
    var status = this.form.querySelector(".form-status");
    if (status) status.textContent = msg;
  };

  ZweliForm.prototype.validate = function () {
    var self = this;
    var values = {};
    var valid = true;

    this.opts.fields.forEach(function (field) {
      var fieldWrap = self.form.querySelector('[data-field="' + field.name + '"]');
      var val;

      if (field.type === "checkboxGroup") {
        var checked = Array.from(self.form.querySelectorAll('input[name="' + field.name + '"]:checked')).map(function (i) { return i.value; });
        val = checked;
        if (field.required && checked.length < (field.minChecked || 1)) {
          self.markError(fieldWrap, true);
          valid = false;
        } else {
          self.markError(fieldWrap, false);
        }
      } else {
        var input = self.form.querySelector('[name="' + field.name + '"]');
        val = input ? input.value.trim() : "";
        var fails = field.required && val === "";
        if (!fails && field.pattern && val !== "" && !field.pattern.test(val)) fails = true;
        self.markError(fieldWrap, fails);
        if (fails) valid = false;
      }
      values[field.name] = val;
    });

    return { valid: valid, values: values };
  };

  ZweliForm.prototype.markError = function (fieldWrap, hasError) {
    if (!fieldWrap) return;
    fieldWrap.classList.toggle("has-error", !!hasError);
  };

  ZweliForm.prototype.openSummary = function (values) {
    var summaryList = this.modal.querySelector(".summary-list");
    summaryList.innerHTML = "";

    this.opts.fields.forEach(function (field) {
      var raw = values[field.name];
      var display = Array.isArray(raw) ? raw.join(", ") : raw;
      if (!display) return;
      var li = document.createElement("li");
      li.innerHTML = "<strong>" + escapeHtml(field.label) + "</strong><span>" + escapeHtml(display) + "</span>";
      summaryList.appendChild(li);
    });

    var waLink = this.modal.querySelector("[data-whatsapp-send]");
    var emailLink = this.modal.querySelector("[data-email-send]");
    var cfg = window.ZWELI_CONFIG || {};
    var message = this.opts.buildMessage(values);
    if (waLink && cfg.whatsappNumber) {
      waLink.href = "https://wa.me/" + cfg.whatsappNumber + "?text=" + encodeURIComponent(message);
    }
    if (emailLink && cfg.contactEmail) {
      var subject = (message.split("\n")[0] || "Zweli Group enquiry").trim();
      emailLink.href = "mailto:" + cfg.contactEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(message);
    }

    this.modal.classList.add("is-open");
    this.modal.setAttribute("aria-hidden", "false");
    var focusTarget = this.modal.querySelector(".modal-close");
    if (focusTarget) focusTarget.focus();
    document.body.style.overflow = "hidden";
  };

  ZweliForm.prototype.closeSummary = function () {
    this.modal.classList.remove("is-open");
    this.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  window.ZweliForm = ZweliForm;

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initFooter();
  });
})();

