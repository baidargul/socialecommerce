import { apiSuccess } from "@/lib/api/response";
import { demoPosts, demoProducts, demoUsers } from "@/lib/demo-data";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.toLowerCase() ?? "";

  return apiSuccess(
    {
      products: demoProducts.filter((product) => product.name.toLowerCase().includes(query)),
      posts: demoPosts.filter((post) => post.caption.toLowerCase().includes(query) || post.hashtags.some((tag) => tag.includes(query))),
      creators: demoUsers.filter((user) => user.username.toLowerCase().includes(query)),
    },
    startedAt,
    { cache: "demo" },
  );
}
