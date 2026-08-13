import type { Tables } from "@/lib/database.types";
test("dummy", () => {
  const x: Tables<"faqs"> = { id: "1", question: "q", answer: "a", sort: 1 };
  expect(x.id).toBe("1");
});
