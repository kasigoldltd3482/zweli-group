"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith(".html"));
const quote = fs.readFileSync(path.join(root, "catering-quote.html"), "utf8");
const cateringConfig = fs.readFileSync(path.join(root, "catering-config.js"), "utf8");
const siteConfig = fs.readFileSync(path.join(root, "config.js"), "utf8");

assert.match(quote, /Send quote request on WhatsApp/);
assert.match(quote, /Print \/ Save as PDF/);
assert.match(quote, /Start again/);
assert.match(quote, /Estimated catering quote/);
assert.match(quote, /not a booking/i);
assert.match(siteConfig, /whatsappNumber:\s*"27614608400"/);
assert.match(siteConfig, /contactEmail:\s*"zweligroup@gmail\.com"/);
assert.match(cateringConfig, /pricePerPerson:\s*null/);
assert.doesNotMatch(cateringConfig, /pricePerPerson:\s*0(?:\D|$)/);

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(root, htmlFile), "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"#?]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|javascript:)/.test(ref)) continue;
    const target = path.resolve(root, ref);
    assert.ok(target.startsWith(root + path.sep), `${htmlFile} contains an unsafe path: ${ref}`);
    assert.ok(fs.existsSync(target), `${htmlFile} references missing file: ${ref}`);
  }
}

console.log("Static site integrity tests passed.");
