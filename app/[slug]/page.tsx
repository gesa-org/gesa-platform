import { notFound } from "next/navigation";
import { getLegalPage } from "@/lib/queries";

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const page = await getLegalPage(params.slug);
  if (!page) notFound();

  return (
    <section className="section narrow">
      <h1 className="mb-4 text-[34px]">{page.title}</h1>
      <p className="whitespace-pre-line text-muted-fg">{page.body}</p>
    </section>
  );
}
