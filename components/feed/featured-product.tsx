import Image from "next/image";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function FeaturedProduct({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <div className="mt-5">
      <p className="mb-2 text-base font-medium text-zinc-500">
        Featured Product
      </p>
      <div className="flex items-center gap-3">
        <div className="relative size-11 overflow-hidden rounded-lg bg-zinc-100">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="52px"
              className="object-cover"
            />
          ) : null}
        </div>
        <p className="text-[15px] font-bold">
          {product.name} - {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
}
