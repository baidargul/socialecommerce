import Image from "next/image";
import { notFound } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductDetailActions } from "@/components/product/product-detail-actions";
import { fetchBackend } from "@/lib/backend-api";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchBackend<Product>(`/api/v1/products/slug/${slug}`);
  if (!product) notFound();
  const image = product.images[0];

  return (
    <MobileShell>
      <div className="relative aspect-square bg-zinc-100">
        {image ? <Image src={image} alt={product.name} fill sizes="430px" className="object-cover" priority /> : null}
      </div>
      <section className="px-5 py-6">
        <p className="text-sm font-black uppercase text-zinc-500">{product.category}</p>
        <h1 className="mt-2 text-4xl font-black">{product.name}</h1>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-3xl font-black text-[#1768d8]">{formatPrice(product.price)}</p>
          {product.originalPrice ? <p className="text-xl font-medium text-zinc-400 line-through">{formatPrice(product.originalPrice)}</p> : null}
        </div>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600">{product.description}</p>
        <ProductDetailActions product={product} />
      </section>
    </MobileShell>
  );
}
