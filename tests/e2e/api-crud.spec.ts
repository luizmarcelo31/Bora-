import { test, expect } from "@playwright/test";

test.describe("Products API CRUD", () => {
  let productId: number;

  test("POST /api/products cria produto", async ({ request }) => {
    const response = await request.fetch("/api/products", {
      method: "POST",
      data: {
        name: "Produto Teste E2E",
        price: 1000,
        cost: 500,
        sku: "E2E-001",
        barcode: "1234567890123",
      },
    });
    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.name).toBe("Produto Teste E2E");
    expect(data.price).toBe(1000);
    productId = data.id;
  });

  test("GET /api/products retorna produto criado", async ({ request }) => {
    const response = await request.fetch("/api/products");
    expect(response.status()).toBe(200);
    const data = await response.json();
    const found = data.find((p: { id: number }) => p.id === productId);
    expect(found).toBeTruthy();
    expect(found.name).toBe("Produto Teste E2E");
  });

  test("POST /api/products com dados invalidos retorna 400", async ({
    request,
  }) => {
    const response = await request.fetch("/api/products", {
      method: "POST",
      data: {
        name: "",
        price: -100,
      },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Sales API", () => {
  test("GET /api/sales retorna array", async ({ request }) => {
    const response = await request.fetch("/api/sales");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("POST /api/sales sem itens retorna erro", async ({ request }) => {
    const response = await request.fetch("/api/sales", {
      method: "POST",
      data: {
        items: [],
        paymentMethod: "CASH",
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("Stock API", () => {
  test("GET /api/stock retorna array", async ({ request }) => {
    const response = await request.fetch("/api/stock");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("CashBox API", () => {
  test("GET /api/cashbox retorna array", async ({ request }) => {
    const response = await request.fetch("/api/cashbox");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Financial API", () => {
  test("GET /api/financial retorna array", async ({ request }) => {
    const response = await request.fetch("/api/financial");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

test.describe("Search API", () => {
  test("GET /api/search?q=test retorna resultados", async ({ request }) => {
    const response = await request.fetch("/api/search?q=test");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("products");
    expect(data).toHaveProperty("sales");
  });

  test("GET /api/search sem query retorna erro", async ({ request }) => {
    const response = await request.fetch("/api/search");
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
