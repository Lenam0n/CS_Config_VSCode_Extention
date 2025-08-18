import { AliasIndex } from "@feature/aliasIndex";
import { makeDoc } from "~helper/doc.test";

describe("AliasIndex", () => {
  test("parses quoted and unquoted alias names/values", () => {
    const doc = makeDoc([
      'alias "jumpthrow" "+jump; -attack; -attack2; -jump"',
      "alias fastgrenade +attack; -attack",
      'alias TAB "\\\\escaped \\"quote\\""',
    ]);
    const idx = new AliasIndex();
    idx.scan(doc);

    expect(idx.isAlias(doc as any, "jumpthrow")).toBe(true);
    expect(idx.getValue(doc as any, "jumpthrow")).toContain("+jump");
    expect(idx.isAlias(doc as any, "fastgrenade")).toBe(true);
    expect(idx.getValue(doc as any, "TAB")).toBe('\\escaped "quote"'); // unescape works
  });

  test("resolve handles nested chains and flattens first tokens", () => {
    const doc = makeDoc([
      "alias one two; three",
      "alias two +attack; four",
      'alias four "smile"; five',
      "alias three -duck",
    ]);
    const idx = new AliasIndex();
    idx.scan(doc);
    const res = idx.resolve(doc as any, "one")!;
    expect(res.steps).toEqual(["one", "two", "four", "three"].slice(1)); // internal steps store visited aliases except root
    expect(res.flattened).toEqual(["+attack", "smile", "five", "-duck"]); // final first tokens
    expect(res.cycle).toBeUndefined();
  });

  test("resolve detects cycles", () => {
    const doc = makeDoc([
      "alias a b",
      "alias b c",
      "alias c a", // cycle
    ]);
    const idx = new AliasIndex();
    idx.scan(doc);
    const res = idx.resolve(doc as any, "a")!;
    expect(res.cycle).toBeTruthy();
    expect(Array.isArray(res.cycle)).toBe(true);
    // cycle should include repeating node
    expect(res.cycle![0]).toBe("a");
    expect(res.cycle![res.cycle!.length - 1]).toBe("a");
  });

  test("resolve respects depth limit", () => {
    const lines: string[] = [];
    for (let i = 0; i < 40; i++) {
      const name = `a${i}`;
      const next = i === 39 ? "+attack" : `a${i + 1}`;
      lines.push(`alias ${name} ${next}`);
    }
    const doc = makeDoc(lines);
    const idx = new AliasIndex();
    idx.scan(doc);
    const res = idx.resolve(doc as any, "a0", 8)!;
    // depth limit reached, so no huge steps
    expect(res.steps.length).toBeLessThanOrEqual(8);
  });

  test("non-cs2cfg docs are ignored", () => {
    const doc = makeDoc(["alias x y"], "plaintext");
    const idx = new AliasIndex();
    idx.scan(doc as any);
    expect(idx.isAlias(doc as any, "x")).toBe(false);
  });

  test("clear removes map and emits event", () => {
    const doc = makeDoc(["alias x y"]);
    const idx = new AliasIndex();
    const spy = jest.fn();
    idx.onDidUpdate(spy);
    idx.scan(doc as any);
    idx.clear(doc as any);
    expect(spy).toHaveBeenCalled();
    expect(idx.isAlias(doc as any, "x")).toBe(false);
  });
});
