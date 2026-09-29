import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { AppSheet } from "./app-sheet";
import { FormSheet } from "./form-sheet";
import { ConfirmSheet } from "./confirm-sheet";

function AppHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      <AppSheet
        open={open}
        onOpenChange={setOpen}
        title="Título teste"
        description="Descrição teste"
        footer={<button>rodapé</button>}
      >
        <p>corpo</p>
      </AppSheet>
    </>
  );
}

describe("AppSheet", () => {
  test("abre com título, corpo e rodapé; Escape fecha", async () => {
    const user = userEvent.setup();
    render(<AppHarness />);
    await user.click(screen.getByRole("button", { name: "abrir" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Título teste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "rodapé" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

function FormHarness({ onSubmit }: { onSubmit: (fd: FormData) => void }) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  return (
    <FormSheet
      open={open}
      onOpenChange={setOpen}
      title="Form teste"
      submitLabel="Salvar teste"
      pending={false}
      dirty={name.length > 0}
      onSubmit={onSubmit}
    >
      <label>
        Nome
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </FormSheet>
  );
}

describe("FormSheet", () => {
  test("submit chama onSubmit e fechar com alterações pede confirmação", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<FormHarness onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText("Nome"), "abc");
    await user.click(screen.getByRole("button", { name: "Salvar teste" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].get("nope" as never)).toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.getByText("Descartar alterações?")).toBeInTheDocument();
  });

  test("pending desabilita e mostra Salvando", () => {
    render(
      <FormSheet
        open
        onOpenChange={() => {}}
        title="T"
        submitLabel="Salvar teste"
        pending
        dirty={false}
        onSubmit={() => {}}
      >
        <p>x</p>
      </FormSheet>
    );
    const btn = screen.getByRole("button", { name: "Salvando…" });
    expect(btn).toBeDisabled();
  });
});

function ConfirmHarness({ onConfirm }: { onConfirm: (c?: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={setOpen}
      title="Excluir?"
      consequence="Volta ao estoque."
      destructiveLabel="Excluir"
      options={["A", "B"]}
      onConfirm={(c) => {
        onConfirm(c);
        setOpen(false);
      }}
    />
  );
}

describe("ConfirmSheet", () => {
  test("confirma com chip escolhido; cancelar fecha sem confirmar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmHarness onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "B" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(onConfirm).toHaveBeenCalledWith("B");
    expect(screen.queryByText("Excluir?")).not.toBeInTheDocument();
  });
});
