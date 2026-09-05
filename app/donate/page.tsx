import DonatePage from "@/components/donate/DonatePage";

export const metadata = {
  title: "Donate — GESA",
  description: "Help gifted professional support reach more people, across languages, cultures and borders.",
};

// Phase 98 — new route for the Header's "DONATE" CTA (previously "JOIN
// GESA," which opened the volunteer application modal). See
// components/donate/DonatePage.tsx for the actual page content/layout.
export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  return <DonatePage searchParams={searchParams} />;
}
