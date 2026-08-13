// Placeholder directory data for Phase 2 (UI only).
// Phase 3 replaces this with a live Supabase query against `therapists`.
export interface Therapist {
  slug: string;
  fullName: string;
  roleLabel: string;
  shortSummary: string;
  expertise: string[];
  languages: string[];
  meetingDuration: string;
  gender: string;
  isVerified: boolean;
  photo: string | null;
}

export const SAMPLE_THERAPISTS: Therapist[] = [
  {
    slug: "abi-hartuv",
    fullName: "Abi Hartuv",
    roleLabel: "Emotional Support for Couples",
    shortSummary:
      "Sometimes life asks more of us than we feel equipped to give. Relationships become strained, roles shift, or we lose sight of who we are.",
    expertise: ["Emotional Support for Couples", "Family Support"],
    languages: ["English", "Hebrew"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/abi-hartuv.png",
  },
  {
    slug: "adriana-viladoms",
    fullName: "Adriana Viladoms",
    roleLabel: "Children and Adolescents",
    shortSummary:
      "Dedicated to psychoanalytic and supportive psychotherapy. Works with teenagers and adults, including eating disorders.",
    expertise: ["Children and Adolescents", "Emotional Support", "Psychotherapy"],
    languages: ["Spanish"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/adriana-viladoms.png",
  },
  {
    slug: "amelia-saed-grego",
    fullName: "Amelia Saed Grego",
    roleLabel: "Emotional Support",
    shortSummary: "Works as a somatic therapist, regulating the nervous system. Speaks a little Hebrew.",
    expertise: ["Emotional Support"],
    languages: ["English", "Spanish"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/amelia-saed-grego.png",
  },
  {
    slug: "amir-alon",
    fullName: "Amir Alon",
    roleLabel: "Coach (Life Coach)",
    shortSummary: "Life coaching support across English, French, and Hebrew.",
    expertise: ["Coach (Life Coach)", "Emotional Support"],
    languages: ["English", "French", "Hebrew"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/amir-alon.png",
  },
  {
    slug: "amit-giat",
    fullName: "Amit Giat",
    roleLabel: "Emotional Support",
    shortSummary: "Energy-based therapy that involves connecting to the heart and listening to one's inner truth.",
    expertise: ["Emotional Support", "Mindful Self Compassion"],
    languages: ["English", "Hebrew", "Spanish"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/amit-giat.png",
  },
  {
    slug: "anastasiya-debono",
    fullName: "Anastasiya Debono",
    roleLabel: "Coach (Life Coach)",
    shortSummary:
      "RMT-certified life coach helping people overcome loss, find meaning, and process trauma.",
    expertise: ["Coach (Life Coach)", "Emotional Support"],
    languages: ["English", "Russian"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/anastasiya-debono.png",
  },
  {
    slug: "anat-avisar",
    fullName: "Anat Avisar",
    roleLabel: "Family Support",
    shortSummary: "Guides parents who wish to nurture and strengthen their child's essential life skills.",
    expertise: ["Family Support"],
    languages: ["Hebrew"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/anat-avisar.png",
  },
  {
    slug: "andrea-konig-plasberg",
    fullName: "Andrea König-Plasberg",
    roleLabel: "Psychotherapy",
    shortSummary:
      "Heilpraktikerin für Psychotherapie supporting people through crises and conflict with relaxation techniques.",
    expertise: ["Psychotherapy"],
    languages: ["English", "German"],
    meetingDuration: "45 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/andrea-konig-plasberg.png",
  },
  {
    slug: "andy-wang",
    fullName: "Andy Wang",
    roleLabel: "Children and Adolescents",
    shortSummary: "Years of support work with adults and children; recently qualified in Counselling.",
    expertise: ["Children and Adolescents", "Social Work"],
    languages: ["English"],
    meetingDuration: "60 Minutes",
    gender: "Prefer not to say",
    isVerified: true,
    photo: "/images/therapists/andy-wang.png",
  },
];
