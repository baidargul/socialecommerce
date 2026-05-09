import { notFound } from "next/navigation";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { MobileShell } from "@/components/layout/mobile-shell";
import { SheetHost } from "@/components/sheets/sheet-host";
import { fetchBackend } from "@/lib/backend-api";
import type { FeedPost } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchBackend<FeedPost>(`/api/v1/posts/slug/${slug}`);
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
