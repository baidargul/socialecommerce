import { notFound } from "next/navigation";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SheetHost } from "@/components/sheets/sheet-host";
import { getDemoPostBySlug } from "@/lib/demo-data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getDemoPostBySlug(slug);
  if (!post) notFound();

  return (
    <MobileShell>
      <FeedPostCard post={post} />
      <section className="px-5 py-6">
        <h2 className="text-2xl font-black">Related products</h2>
        <p className="mt-2 text-lg font-medium text-zinc-500">More creator picks will appear here as the catalog grows.</p>
      </section>
      <SheetHost />
    </MobileShell>
  );
}
