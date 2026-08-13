import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { getBlogPostBySlug } from "@/lib/queries";

export const revalidate = 300;

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <article className="section narrow">
      {post.category && <Badge>{post.category}</Badge>}
      <h1 className="mt-4 mb-2 text-[34px]">{post.title}</h1>
      <div className="mb-6 text-sm text-muted-fg">
        {post.author}
        {post.published_at &&
          ` · ${new Date(post.published_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}`}
      </div>
      <p className="whitespace-pre-line text-muted-fg">{post.body}</p>
    </article>
  );
}
