import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PressProductButton } from "./press-product-button";

describe("PressProductButton", () => {
  test("toque adiciona uma vez com nome acessível", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <PressProductButton id={7} label="Coca 2L, R$ 12,99" onAdd={onAdd}>
        Coca 2L
      </PressProductButton>
    );
    const btn = screen.getByRole("button", { name: "Coca 2L, R$ 12,99" });
    await user.click(btn);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(7);
  });

  test("teclado Enter adiciona uma vez", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <PressProductButton id={3} label="Água" onAdd={onAdd}>
        Água
      </PressProductButton>
    );
    const btn = screen.getByRole("button", { name: "Água" });
    btn.focus();
    await user.keyboard("{Enter}");
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  test("desabilitado não adiciona", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <PressProductButton id={9} label="Sem estoque" disabled onAdd={onAdd}>
        X
      </PressProductButton>
    );
    await user.click(screen.getByRole("button", { name: "Sem estoque" }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
