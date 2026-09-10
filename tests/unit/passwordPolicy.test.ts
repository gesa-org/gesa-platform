import { evaluatePassword, isCommonlyCompromised, passwordPolicyMessage } from "@/lib/auth/passwordPolicy";

describe("passwordPolicy", () => {
  it("rejects passwords missing any required character class or under 12 characters", () => {
    expect(evaluatePassword("short1!").passed).toBe(false); // too short
    expect(evaluatePassword("alllowercase123!").passed).toBe(false); // no uppercase
    expect(evaluatePassword("ALLUPPERCASE123!").passed).toBe(false); // no lowercase
    expect(evaluatePassword("NoNumbersHere!!").passed).toBe(false); // no number
    expect(evaluatePassword("NoSymbolsHere123").passed).toBe(false); // no symbol
  });

  it("accepts a password meeting every rule", () => {
    const result = evaluatePassword("NewPassw0rd!23");
    expect(result.passed).toBe(true);
    expect(result.failedRules).toHaveLength(0);
  });

  it("flags commonly-compromised passwords even if they meet every rule", () => {
    expect(isCommonlyCompromised("Password123!")).toBe(false); // not in the (small) list — sanity check on the checker itself
    expect(isCommonlyCompromised("changeme123!")).toBe(true);
    expect(evaluatePassword("changeme123!").passed).toBe(false);
  });

  it("returns null from passwordPolicyMessage only when the password passes", () => {
    expect(passwordPolicyMessage("NewPassw0rd!23")).toBeNull();
    expect(passwordPolicyMessage("weak")).not.toBeNull();
  });
});
