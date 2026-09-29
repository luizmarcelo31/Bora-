import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { LastItemStrip } from "./last-item-strip";
import { TicketSheet } from "./ticket-sheet";
import { QuantitySheet } from "./quantity-sheet";

const LINES = [
  { id: 1, name: "Coca 2L", qty: 2, total: 2598, price: 1299, stock: 10, imageUrl: null as string | null },
];

describe("LastItemStrip", () => {
  test("stepper altera e abre ticket", async () => {
    const user = userEvent.setup();
    const onQty = vi.fn();
    const onOpenTicket = vi.fn();
    render(
      <LastItemStrip
        line={LINES[0]}
        itemCount={2}
        subtotal={2598}
        onQty={onQty}
        onOpenTicket={onOpenTicket}
      />
    );
    await user.click(screen.getByRole("button", { name: "Aumentar Coca 2L" }));
    expect(onQty).toHaveBeenCalledWith(1, 3);
    await user.click(screen.getByRole("button", { name: /ver ticket/ }));
    expect(onOpenTicket).toHaveBeenCalledTimes(1);
  });

  test("sem linha mostra vazio", () => {
    render(
      <LastItemStrip line={null} itemCount={0} subtotal={0} onQty={() => {}} onOpenTicket={() => {}} />
    );
    expect(screen.getByText("Toque num produto para começar.")).toBeInTheDocument();
  });
});

describe("TicketSheet", () => {
  test("linhas com stepper, remover e limpar", async () => {
    const user = userEvent.setup();
    const onQty = vi.fn();
    const onRemove = vi.fn();
    const onClear = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <TicketSheet
          open={open}
          onOpenChange={setOpen}
          lines={LINES}
          subtotal={2598}
          onQty={onQty}
          onQtyTap={() => {}}
          onRemove={onRemove}
          onClear={onClear}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByText("Ticket")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Diminuir Coca 2L" }));
    expect(onQty).toHaveBeenCalledWith(1, 1);
    await user.click(screen.getByRole("button", { name: "Remover Coca 2L" }));
    expect(onRemove).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole("button", { name: "Limpar venda" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("QuantitySheet", () => {
  test("atalho confirma direto; teclado livre confirma", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <QuantitySheet
          open={open}
          onOpenChange={setOpen}
          productName="Coca 2L"
          initialQty={1}
          onConfirm={onConfirm}
        />
      );
    }
    render(<Harness />);
    const presets = within(screen.getByRole("group", { name: "Atalhos de quantidade" }));
    await user.click(presets.getByRole("button", { name: "6" }));
    expect(onConfirm).toHaveBeenCalledWith(6);
  });
});
