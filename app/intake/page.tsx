import Link from "next/link";
import { Phone, MessageCircle, Globe2, ExternalLink } from "lucide-react";
import { getCrisisResources, getRandomMatchedTherapist } from "@/lib/queries";
import IntakeMatchFlow from "@/components/intake/IntakeMatchFlow";

const PATH_MAP: Record<string, { label: string; entryRoute: string }> = {
  crisis: { label: "In crisis right now", entryRoute: "crisis" },
  veteran: { label: "Veterans, reservists & families", entryRoute: "veteran_reservist_family" },
  general: { label: "Seeking support", entryRoute: "seeking_help" },
  helpers: { label: "Helping the helpers", entryRoute: "helpers" },
};

export default async function IntakePage({
  searchParams,
}: {
  searchParams: { path?: string };
}) {
  const pathKey = searchParams.path && PATH_MAP[searchParams.path] ? searchParams.path : "general";
  const { label, entryRoute } = PATH_MAP[pathKey];

  const therapist = await getRandomMatchedTherapist();
  const crisisResources = pathKey === "crisis" ? await getCrisisResources() : [];

  return (
    <div className="section wrap max-w-[640px]">
      <div className="text-center">
        <span className="eyebrow">{label}</span>
        <h1 className="mx-auto mt-3 mb-2.5 max-w-[560px] text-[32px]">
          {pathKey === "crisis" ? "Help is available right now" : "You&apos;re one step from support"}
        </h1>
      </div>

      {pathKey === "crisis" && crisisResources.length > 0 && (
        <div className="mt-8 flex flex-col gap-2.5">
          {crisisResources.slice(0, 4).map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-accent-soft text-primary">
                {r.hotline.startsWith("http") ? (
                  <ExternalLink size={18} />
                ) : r.hotline.toLowerCase().includes("text") ? (
                  <MessageCircle size={18} />
                ) : (
                  <Phone size={18} />
                )}
              </span>
              <span>
                <strong className="block">{r.region}</strong>
                <span className="text-sm text-muted-fg">
                  {r.hotline} {r.hours ? `· ${r.hours}` : ""}
                </span>
              </span>
            </div>
          ))}
          <div className="mt-1 rounded-xl bg-accent-soft px-3.5 py-3 text-sm text-primary-600">
            GESA is not an emergency service. If you are in immediate danger, call your local emergency
            number.
          </div>
          <Link href="/" className="mx-auto mt-2 text-[12px]">
            <Globe2 size={14} className="inline mr-1" />
            More helplines at{" "}
            <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="underline">
              findahelpline.com
            </a>
          </Link>
        </div>
      )}

      <div className="mt-8">
        {pathKey === "crisis" && (
          <p className="mb-4 text-center text-[14.5px] text-muted-fg">
            You can also connect with a volunteer therapist for ongoing, free support.
          </p>
        )}
        {therapist ? (
          <IntakeMatchFlow entryRoute={entryRoute} therapist={therapist} />
        ) : (
          <p className="text-center text-muted-fg">
            We don&apos;t have any verified therapists available right now — please check back soon or{" "}
            <Link href="/contact" className="underline">
              contact us
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
