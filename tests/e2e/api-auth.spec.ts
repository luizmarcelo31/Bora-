import { test, expect } from "@playwright/test";

const API_ROUTES = [
  { path: "/api/products", method: "GET" },
  { path: "/api/sales", method: "GET" },
  { path: "/api/users", method: "GET" },
  { path: "/api/tenants", method: "GET" },
  { path: "/api/financial", method: "GET" },
  { path: "/api/stock", method: "GET" },
  { path: "/api/cashbox", method: "GET" },
  { path: "/api/search?q=test", method: "GET" },
];

test.describe("API Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of API_ROUTES) {
    test(`${route.method} ${route.path} retorna 401 sem autenticacao`, async ({
      request,
    }) => {
      const response = await request.fetch(route.path, {
        method: route.method,
      });
      expect(response.status()).toBe(401);
    });
  }
});

test.describe("API with Auth", () => {
  test("GET /api/products retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/products");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/sales retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/sales");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/users retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/users");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/tenants retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/tenants");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/financial retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/financial");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/stock retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/stock");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/cashbox retorna 200", async ({ request }) => {
    const response = await request.fetch("/api/cashbox");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
