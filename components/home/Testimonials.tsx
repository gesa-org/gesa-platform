import { Quote } from "lucide-react";
import Card from "@/components/ui/Card";
import type { Tables } from "@/lib/database.types";

export default function Testimonials({ testimonials }: { testimonials: Tables<"testimonials">[] }) {
  if (!testimonials.length) return null;

  return (
    <section className="section wrap">
      <div className="text-center">
        <span className="eyebrow">Stories of healing</span>
        <h2 className="my-2.5 text-[34px]">In their words</h2>
      </div>
      <div className="mt-10 grid gap-[22px] md:grid-cols-3">
        {testimonials.map((t) => (
          <Card key={t.id}>
            <Quote size={26} className="text-clay" />
            <p className="my-3 text-[16.5px]">{t.quote}</p>
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <div className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full bg-secondary font-serif font-semibold text-primary">
                {t.author}
              </div>
              <div>
                <div className="font-bold">{t.author}</div>
                <div className="text-[13px] text-muted-fg">{t.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
