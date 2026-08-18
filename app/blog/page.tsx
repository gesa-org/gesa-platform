import Link from "next/link";
import { Newspaper } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageHero from "@/components/ui/PageHero";
import { getPublishedBlogPosts } from "@/lib/queries";

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <>
      <PageHero
        icon={Newspaper}
        eyebrow="Blog"
        title="In the Press & Resources"
        description="Updates from GESA, and resources from our network of volunteer therapists."
      />
      <section className="section wrap pt-0">
        {posts.length ? (
          <div className="grid gap-[22px] sm:grid-cols-2">
            {posts.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`}>
                <Card className="h-full">
                  {p.category && <Badge>{p.category}</Badge>}
                  <h2 className="mt-3.5 mb-2 text-xl">{p.title}</h2>
                  <div className="text-sm text-muted-fg">
                    {p.author}
                    {p.published_at &&
                      ` · ${new Date(p.published_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}`}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius)] border border-border bg-card p-7 text-center text-muted-fg">
            No posts published yet — check back soon.
          </div>
        )}
      </section>
    </>
  );
}
