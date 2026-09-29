import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Field } from "./field";
import { MoneyInput } from "./money-input";
import { QuantityStepper } from "./quantity-stepper";
import { ChipSelect, BarcodeField } from "./fields";
import { Input } from "@/components/ui/input";

describe("Field", () => {
  test("erro ligado ao campo com role=alert", () => {
    render(
      <Field label="Nome" required error="Obrigatório">
        <Input />
      </Field>
    );
    const input = screen.getByLabelText(/Nome/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Obrigatório");
  });
});

describe("MoneyInput", () => {
  test('"1299" vira R$ 12,99 e 1299 centavos', async () => {
    const user = userEvent.setup();
    let cents = 0;
    function Harness() {
      const [v, setV] = useState(0);
      cents = v;
      return <MoneyInput aria-label="Valor" value={v} onChange={setV} />;
    }
    render(<Harness />);
    const input = screen.getByLabelText("Valor");
    await user.type(input, "1299");
    expect(input).toHaveValue("12,99");
    expect(cents).toBe(1299);
  });
});

describe("QuantityStepper", () => {
  test("incrementa, decrementa e respeita mínimo", async () => {
    const user = userEvent.setup();
    let v = 1;
    function Harness() {
      const [n, setN] = useState(1);
      v = n;
      return <QuantityStepper value={n} min={1} onChange={setN} label="Qtd" />;
    }
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Aumentar" }));
    expect(v).toBe(2);
    await user.click(screen.getByRole("button", { name: "Diminuir" }));
    await user.click(screen.getByRole("button", { name: "Diminuir" }));
    expect(v).toBe(1);
  });
});

describe("ChipSelect", () => {
  test("troca com aria-pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = useState("a");
      return (
        <ChipSelect
          label="Tipo"
          value={v}
          onChange={(x) => {
            setV(x);
            onChange(x);
          }}
          options={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ]}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});

describe("BarcodeField", () => {
  test("digitação sem câmera (jsdom não tem BarcodeDetector)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Harness() {
      const [v, setV] = useState("");
      return (
        <BarcodeField
          value={v}
          onChange={(x) => {
            setV(x);
            onChange(x);
          }}
        />
      );
    }
    render(<Harness />);
    await user.type(screen.getByLabelText("Código de barras"), "789123");
    expect(onChange).toHaveBeenLastCalledWith("789123");
    expect(screen.queryByRole("button", { name: "Escanear com câmera" })).not.toBeInTheDocument();
  });
});
