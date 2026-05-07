import { apiSuccess } from "@/lib/api/response";
import { demoProducts } from "@/lib/demo-data";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.toLowerCase() ?? "";
  const items = query
    ? demoProducts.filter((product) => `${product.name} ${product.tags.join(" ")}`.toLowerCase().includes(query))
    : demoProducts;

  return apiSuccess({ items, nextCursor: null }, startedAt, { cache: "demo" });
}
