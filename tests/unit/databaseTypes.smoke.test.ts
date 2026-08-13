import type { Tables } from "@/lib/database.types";

// Compile-time + runtime smoke test: confirms lib/database.types.ts type
// helpers resolve correctly and stay in sync with the shape other tests rely
// on (e.g. TherapistsDirectory.test.tsx, FaqAccordion.test.tsx).
test("Tables<> helper resolves a real row shape", () => {
  const faq: Tables<"faqs"> = { id: "1", question: "q", answer: "a", sort: 1 };
  expect(faq.id).toBe("1");
});
