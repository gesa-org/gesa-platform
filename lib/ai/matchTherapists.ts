import Anthropic from "@anthropic-ai/sdk";
import type { Tables, GenderPreference } from "@/lib/database.types";

export type TherapistMatch = {
  therapistId: string;
  reasoning: string;
};

export type MatchInput = {
  symptoms: string[];
  treatmentType: string | null;
  genderPreference: GenderPreference;
};

type CandidateTherapist = Pick<
  Tables<"therapists">,
  "id" | "full_name" | "specialties" | "short_summary" | "bio" | "languages" | "gender" | "years_experience"
>;

const MAX_MATCHES = 3;

// Real, structured matching data is sparse (see EXECUTION_PLAN.md Phase 7/9
// notes — `tracks` is empty on every therapist, `specialties` is a loose,
// partly non-English free-text list). An LLM is well suited to fuzzy-match
// plain-language symptoms/preferences against that messy real data, but the
// call can fail or time out — this must never leave a client with zero
// matches, so every failure path falls back to ruleBasedMatch() below.
export async function matchTherapists(
  input: MatchInput,
  candidates: CandidateTherapist[]
): Promise<TherapistMatch[]> {
  if (candidates.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[match] ANTHROPIC_API_KEY not set — using rule-based fallback matching");
    return ruleBasedMatch(input, candidates);
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const roster = candidates.map((t) => ({
      id: t.id,
      specialties: t.specialties,
      languages: t.languages,
      gender: t.gender,
      years_experience: t.years_experience,
      summary: t.short_summary,
      bio: t.bio?.slice(0, 400) ?? null,
    }));

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "You match people seeking free volunteer therapy to the most suitable therapist from a roster. " +
        "Respond with ONLY a JSON array (no prose, no markdown fences) of up to " +
        MAX_MATCHES +
        ' objects: [{"id": "<therapist id from the roster>", "reasoning": "<one warm, plain-language sentence, under 25 words, addressed to the client>"}]. ' +
        "Only use ids that appear in the roster. Treat the gender preference as a soft preference, not a hard filter — " +
        "if no therapist with that gender fits well, include your best matches regardless. Never mention that you are an AI.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            client_described_experiences: input.symptoms,
            preferred_treatment_type: input.treatmentType,
            therapist_gender_preference: input.genderPreference,
            therapist_roster: roster,
          }),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("no text response from model");

    const parsed = JSON.parse(extractJson(textBlock.text)) as Array<{ id: string; reasoning: string }>;
    const validIds = new Set(candidates.map((c) => c.id));
    const matches = parsed
      .filter((m) => validIds.has(m.id))
      .slice(0, MAX_MATCHES)
      .map((m) => ({ therapistId: m.id, reasoning: m.reasoning }));

    if (matches.length === 0) throw new Error("model returned no valid matches");
    return matches;
  } catch (err) {
    console.error("[match] AI matching failed, falling back to rule-based matching", err);
    return ruleBasedMatch(input, candidates);
  }
}

function extractJson(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no JSON array found in model response");
  return text.slice(start, end + 1);
}

function ruleBasedMatch(input: MatchInput, candidates: CandidateTherapist[]): TherapistMatch[] {
  const needle = [...input.symptoms, input.treatmentType ?? ""].join(" ").toLowerCase();
  const words = needle.split(/[^a-z]+/).filter((w) => w.length > 3);

  const scored = candidates.map((t) => {
    const haystack = [...t.specialties, t.short_summary ?? "", t.bio ?? ""].join(" ").toLowerCase();
    let score = words.reduce((acc, w) => acc + (haystack.includes(w) ? 1 : 0), 0);
    if (input.genderPreference !== "no_preference" && t.gender === input.genderPreference) score += 2;
    return { therapist: t, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_MATCHES).map(({ therapist, score }) => ({
    therapistId: therapist.id,
    reasoning:
      score > 0
        ? `Matched based on shared focus areas: ${therapist.specialties.slice(0, 2).join(", ") || "general support"}.`
        : "One of our verified volunteer therapists with availability for new clients.",
  }));
}
