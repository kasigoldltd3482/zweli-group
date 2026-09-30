# Zweli Group

South African catering, travel and solar.

## Catering quotation tool

The static quotation tool is available at `catering-quote.html`. It works on GitHub Pages without a backend and sends a pre-filled request to the verified business WhatsApp number. The customer must press Send in WhatsApp.

Update approved menus, prices, extras, minimums and charges in `catering-config.js`. Keep an unknown value as `null`; the website will display **To be confirmed** and will not silently treat it as free.

Update the WhatsApp number, email address or group name in `config.js`.

The price engine is in `catering-calculator.js`; page behaviour is in `catering-quote.js`; quotation-specific styles and print-to-PDF layout are at the bottom of `styles.css`.
