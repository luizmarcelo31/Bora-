import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ScanBar } from "./scan-bar";
import { ProductTiles } from "./product-tiles";
import type { ExpressProduct } from "../_lib/use-express-sale";

const PRODUCTS: ExpressProduct[] = [
  { id: 1, name: "Coca 2L", price: 1299, stock: 10, barcode: "111", category: "Bebidas", imageUrl: null },
  { id: 2, name: "Pão", price: 100, stock: 0, barcode: "222", category: "Padaria", imageUrl: null },
];

describe("ScanBar", () => {
  test("Enter dispara busca, aviso persistente com role=alert, ⌨ alterna modo", async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();
    function Harness() {
      const [v, setV] = useState("");
      return <ScanBar value={v} onChange={setV} onEnter={onEnter} warning={null} focusKey={0} />;
    }
    render(<Harness />);
    const input = screen.getByLabelText("Buscar produto ou bipar código");
    expect(input).toHaveAttribute("inputmode", "none");
    await user.type(input, "111{Enter}");
    expect(onEnter).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Modo teclado" }));
    expect(screen.getByLabelText("Buscar produto ou bipar código")).toHaveAttribute("inputmode", "search");
  });

  test("aviso de código inexistente", () => {
    render(
      <ScanBar value="999" onChange={() => {}} onEnter={() => {}} warning="Código 999 não está cadastrado." focusKey={0} />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("não está cadastrado");
  });
});

describe("ProductTiles", () => {
  test("chips filtram, sem estoque desabilita com texto", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    function Harness() {
      const [cat, setCat] = useState("★");
      const visible =
        cat === "★" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
      return (
        <ProductTiles
          products={visible}
          categories={["Bebidas", "Padaria"]}
          activeCategory={cat}
          onCategory={setCat}
          cartQty={() => 0}
          onAdd={onAdd}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByRole("button", { name: /Coca 2L/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Padaria" }));
    const pao = screen.getByRole("button", { name: /Pão/ });
    expect(pao).toBeDisabled();
    expect(screen.getByText("Sem estoque")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Coca 2L/ })).not.toBeInTheDocument();
  });
});
