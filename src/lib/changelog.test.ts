import { describe, expect, it } from "vitest";

import {
  CHANGELOG,
  CHANGELOG_NAV_ID,
  CURRENT_CHANGELOG_VERSION,
  hasUnseenChanges,
  unseenVersions,
} from "./changelog";

describe("changelog", () => {
  it("mantém a ordem da mais nova para a mais antiga", () => {
    // `unseenVersions` fatia por índice: se a ordem virar, o badge some na
    // versão errada sem nenhum teste quebrar.
    expect(CHANGELOG[0]?.version).toBe(CURRENT_CHANGELOG_VERSION);
  });

  it("não tem versão duplicada nem vazia", () => {
    const versions = CHANGELOG.map((release) => release.version);

    expect(new Set(versions).size).toBe(versions.length);
    expect(versions.every((version) => version.length > 0)).toBe(true);
  });

  describe("unseenVersions", () => {
    it("devolve tudo quando nunca viu nada", () => {
      expect(unseenVersions(null)).toHaveLength(CHANGELOG.length);
      expect(unseenVersions(undefined)).toHaveLength(CHANGELOG.length);
      expect(unseenVersions("")).toHaveLength(CHANGELOG.length);
    });

    it("devolve nada quando já viu a versão atual", () => {
      expect(unseenVersions(CURRENT_CHANGELOG_VERSION)).toEqual([]);
    });

    it("devolve só o que é mais novo que a versão vista", () => {
      // Viu a do meio: a de cima é nova, a de baixo já era conhecida.
      const middle = CHANGELOG[1];
      if (!middle) throw new Error("changelog precisa de ao menos 2 versões");

      const unseen = unseenVersions(middle.version);

      expect(unseen.map((release) => release.version)).toEqual(
        CHANGELOG.slice(0, CHANGELOG.indexOf(middle)).map((release) => release.version),
      );
    });

    it("nunca devolve versões mais antigas que a vista", () => {
      // Regressão do filtro por desigualdade: ele devolveria também as antigas.
      const oldest = CHANGELOG[CHANGELOG.length - 1];
      if (!oldest) throw new Error("changelog precisa de ao menos 1 versão");

      const seenIndex = CHANGELOG.indexOf(oldest);
      const unseen = unseenVersions(oldest.version);

      expect(unseen).toHaveLength(seenIndex);
      expect(unseen.every((release) => CHANGELOG.indexOf(release) < seenIndex)).toBe(true);
    });

    it("trata versão desconhecida como 'não viu' (ex.: rollback)", () => {
      expect(unseenVersions("versao-que-nao-existe")).toHaveLength(CHANGELOG.length);
    });
  });

  describe("hasUnseenChanges", () => {
    it("é falso só quando viu exatamente a versão atual", () => {
      expect(hasUnseenChanges(CURRENT_CHANGELOG_VERSION)).toBe(false);
    });

    it("é verdadeiro para null, undefined e versão antiga", () => {
      expect(hasUnseenChanges(null)).toBe(true);
      expect(hasUnseenChanges(undefined)).toBe(true);
      expect(hasUnseenChanges("2020-antiga")).toBe(true);
    });
  });

  it("o id do menu do changelog é o mesmo usado na navegação", () => {
    // O badge depende de casar o id; se divergirem, o "novo" nunca some.
    expect(CHANGELOG_NAV_ID).toBe("novidades");
  });
});