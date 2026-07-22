import assert from "node:assert/strict";
import test from "node:test";
import { resolveAppOrigin } from "../lib/app-origin.ts";

test("configured public origin takes precedence", () => {
  assert.equal(resolveAppOrigin({
    configuredOrigin: "https://flock.example.org/",
    forwardedHost: "preview.example.org",
    production: true,
  }), "https://flock.example.org");
});

test("deployed request headers provide a safe fallback", () => {
  assert.equal(resolveAppOrigin({
    forwardedHost: "flock-example.vercel.app",
    forwardedProto: "https",
    production: true,
  }), "https://flock-example.vercel.app");
});

test("development fallback retains the actual host and port", () => {
  assert.equal(resolveAppOrigin({ host: "localhost:3012" }), "http://localhost:3012");
  assert.equal(resolveAppOrigin({ host: "192.168.1.50:3000" }), "http://192.168.1.50:3000");
});

test("unsafe and insecure production origins are rejected", () => {
  assert.equal(resolveAppOrigin({ host: "example.org/path" }), null);
  assert.equal(resolveAppOrigin({ forwardedHost: "example.org", forwardedProto: "http", production: true }), null);
});
