import { firstToken, isCommentLine, tokenAt } from "@util/text";

describe("util/text", () => {
  test("isCommentLine detects // and # with leading spaces", () => {
    expect(isCommentLine("// hi")).toBe(true);
    expect(isCommentLine("   // hi")).toBe(true);
    expect(isCommentLine("# hi")).toBe(true);
    expect(isCommentLine("   # hi")).toBe(true);
    expect(isCommentLine("not a comment // tail")).toBe(false);
  });

  test("firstToken returns null for empty or comment lines", () => {
    expect(firstToken("")).toBeNull();
    expect(firstToken("   ")).toBeNull();
    expect(firstToken(" // x")).toBeNull();
    expect(firstToken("# x")).toBeNull();
  });

  test("firstToken extracts starting word without +/-/~ prefix", () => {
    const hit = firstToken("   r_fullscreen_gamma 2.2");
    expect(hit).not.toBeNull();
    expect(hit!.token).toBe("r_fullscreen_gamma");
    expect(hit!.start).toBe(3);
    expect(hit!.end).toBe(3 + "r_fullscreen_gamma".length);
  });

  test("firstToken accepts dots and underscores in token", () => {
    const hit = firstToken("   some.var_name 1");
    expect(hit!.token).toBe("some.var_name");
  });

  test("tokenAt grabs token under cursor, including + / - / ~ prefix", () => {
    const line = "  +attack; -duck; ~aliasName";
    // positions inside token/prefix
    expect(tokenAt(line, 3)!.token).toBe("+attack"); // inside +attack
    expect(tokenAt(line, 13)!.token).toBe("-duck"); // spacing then -duck
    expect(tokenAt(line, line.indexOf("~aliasName") + 1)!.token).toBe(
      "~aliasName"
    );
  });

  test("tokenAt returns null when not near a token", () => {
    expect(tokenAt("   ; ; ;   ", 0)).toBeNull();
  });

  test("tokenAt handles boundaries gracefully", () => {
    const line = 'bind "e" +use';
    expect(tokenAt(line, -5)!.token).toBe("bind");
    expect(tokenAt(line, 999)!.token).toBe("+use");
  });
});
