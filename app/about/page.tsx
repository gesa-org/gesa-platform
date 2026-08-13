import Link from "next/link";
import { ShieldCheck, HeartHandshake, Users, Globe2, Mail, Phone, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";

export const metadata = {
  title: "About — GESA",
  description: "Who we are: GESA's mission, how it works, and the founders behind it.",
};

const HOW_IT_WORKS = [
  {
    icon: ShieldCheck,
    title: "Verified volunteer therapists",
    body: "A global community of credential-checked professionals who donate their time.",
  },
  {
    icon: HeartHandshake,
    title: "Up to six free sessions",
    body: "Every person receives six sessions at no cost, with continued support afterward at a reduced donation fee.",
  },
  {
    icon: Users,
    title: "Thoughtful matching",
    body: "We pair each person with a therapist who fits their needs, language, and preferences.",
  },
  {
    icon: Globe2,
    title: "Global reach, 20+ languages",
    body: "Support that crosses time zones and speaks your language, online and confidential.",
  },
];

const FOUNDERS = [
  {
    name: "Ilana O'Malley",
    roleTitle: "Co-Founder, GESA",
    email: "ilana@gesa.org",
    shortBio:
      "Ilana helped establish GESA out of a conviction that no one should face emotional pain alone or be priced out of care. She guides the alliance's mission of warm, accessible support and its growing worldwide community of volunteer therapists.",
  },
  {
    name: "Karin Horen",
    roleTitle: "Co-Founder, GESA",
    email: "karin@gesa.org",
    shortBio:
      "Karin co-founded GESA to connect skilled, compassionate therapists with people carrying the weight of war, displacement, and antisemitism. She leads the community and partnerships that keep six sessions free for everyone who reaches out.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export default function AboutPage() {
  return (
    <>
      <section className="hero" style={{ padding: "74px 0" }}>
        <div className="wrap max-w-[820px]">
          <span className="eyebrow">About GESA</span>
          <h1 className="my-3.5 text-[clamp(36px,5vw,50px)]">Who We Are</h1>
          <p className="sub text-muted-fg text-lg">
            GESA (Global Emotional Support Alliance) is a nonprofit, volunteer-powered network that
            makes emotional support free and human for anyone who needs it. We connect verified
            volunteer therapists around the world with people carrying the weight of war, terror, and
            antisemitism.
          </p>
          <p className="sub text-muted-fg text-lg">
            Care should never depend on what you can pay. Everyone who reaches out receives up to six
            free, trauma-informed sessions — no forms upfront, no barriers.
          </p>
        </div>
      </section>

      <section className="section wrap max-w-[760px]">
        <h2 className="text-[30px]">Why GESA exists</h2>
        <p className="text-muted-fg text-[15.5px]">
          Millions of people carry pain that has nowhere to go — after displacement, loss, or the
          quiet exhaustion of staying strong for others. GESA exists to meet that pain with warmth,
          dignity, and real professional care.
        </p>
        <p className="text-muted-fg text-[15.5px]">
          We bring skilled therapists to the people who need them most, across borders and languages,
          and we keep it free at the point of need so that ability to pay is never the reason someone
          goes without support.
        </p>
      </section>

      <section className="section bg-muted">
        <div className="wrap">
          <h2 className="text-center text-[30px] mb-2">How GESA works</h2>
          <div className="mt-7.5 mt-[30px] grid gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((pt) => (
              <Card key={pt.title}>
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-accent-soft text-primary">
                  <pt.icon size={22} />
                </div>
                <h3 className="mt-3.5 mb-1.5 text-[17px]">{pt.title}</h3>
                <p className="text-sm text-muted-fg">{pt.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap max-w-[820px]">
        <div className="text-center">
          <span className="eyebrow">Our Founders</span>
          <h2 className="my-2.5 text-[30px]">Our Founders</h2>
          <p className="mx-auto max-w-[600px] text-muted-fg">
            Meet the founders behind GESA — a global home for free, trauma-informed emotional support.
          </p>
        </div>
        <div className="mt-8.5 mt-[34px] grid gap-[22px] sm:grid-cols-2">
          {FOUNDERS.map((p) => (
            <Card key={p.name} className="flex items-start gap-5">
              <div className="flex h-[112px] w-24 flex-none items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-primary-600 text-[26px] font-serif font-semibold text-white">
                {initials(p.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-xl">{p.name}</h3>
                <div className="my-0.5 mb-2.5 text-sm font-semibold text-primary">{p.roleTitle}</div>
                <p className="mb-2.5 text-[14.5px] text-muted-fg">{p.shortBio}</p>
                <a
                  href={`mailto:${p.email}`}
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary"
                >
                  <Mail size={15} /> {p.email}
                </a>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-5 text-center text-[13px] text-muted-fg">
          More of our team, advisory board, and volunteer network will be introduced here soon.
        </p>
      </section>

      <section className="section bg-gradient-to-br from-primary to-primary-600">
        <div className="wrap text-center max-w-[640px]">
          <h2 className="mb-2.5 text-[30px] text-white">Join us as a caregiver</h2>
          <p className="mx-auto text-white/90">
            Are you a licensed therapist with a few hours a month to give? Your time becomes someone&apos;s
            turning point. Join a global network making care free and human.
          </p>
          <div className="mt-5.5 mt-[22px] flex flex-wrap justify-center gap-3.5">
            <Link
              href="/contact?subject=Volunteer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-primary"
            >
              Become a volunteer therapist <ArrowRight size={16} />
            </Link>
            <Link
              href="/intake"
              className="inline-flex items-center rounded-full border border-white/60 px-6 py-3.5 text-[15px] font-semibold text-white"
            >
              Find a therapist
            </Link>
          </div>
        </div>
      </section>

      <section className="section bg-accent-soft">
        <div className="wrap text-center max-w-[700px]">
          <p className="mb-3 text-[15px] text-primary-600">
            GESA is a registered nonprofit connecting volunteer emotional-support specialists worldwide
            with Israelis facing war-related distress and Jewish communities abroad experiencing
            antisemitism.
          </p>
          <div className="text-[13.5px] leading-[1.9] text-muted-fg">
            <div>
              <strong>Donations are tax-deductible in Israel, the U.S., the U.K., and Spain.</strong>
            </div>
            <div>A registered non-profit organization.</div>
            <div className="mt-2">
              <a href="tel:988" className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <Phone size={15} /> Emergency contact numbers
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
