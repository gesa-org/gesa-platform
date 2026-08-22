import Link from "next/link";

export default function DonateBand() {
  return (
    <section className="section bg-gradient-to-br from-primary to-primary-600">
      <div className="wrap text-center">
        <h2 className="mb-2.5 text-[34px] text-white">Your gift keeps care free</h2>
        <p className="mx-auto max-w-[560px] text-white/90">
          Every donation extends the six free sessions that make GESA possible for people who have
          nowhere else to turn.
        </p>
        <Link
          href="/contact?subject=Donation"
          className="mt-5.5 mt-[22px] inline-flex items-center rounded-full bg-card px-6 py-3.5 text-[15px] font-semibold text-primary transition-transform hover:-translate-y-px"
        >
          Donate to GESA
        </Link>
      </div>
    </section>
  );
}
