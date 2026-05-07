"use client";

import { useMemo } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { TextInput } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useProductStore } from "@/store/use-product-store";

export function ProductGrid({ products }: { products: Product[] }) {
  const query = useProductStore((state) => state.query);
  const category = useProductStore((state) => state.category);
  const setQuery = useProductStore((state) => state.setQuery);
  const setCategory = useProductStore((state) => state.setCategory);
  const categories = ["All", ...Array.from(new Set(products.map((product) => product.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery = `${product.name} ${product.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  return (
    <div className="px-5 py-6">
      <h1 className="text-4xl font-black">Shop</h1>
      <div className="mt-5">
        <TextInput label="Search products" placeholder="Search dresses, decor, bowls..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5">
        {categories.map((item) => (
          <button
            key={item}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${item === category ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {filteredProducts.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title="No products found">Try another search or category.</EmptyState>
      )}
    </div>
  );
}
