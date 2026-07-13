"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Layers3,
  Search,
} from "lucide-react";
import type { CategoryItem } from "@/lib/types";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { apiFetch } from "@/lib/api-url";

type CategoryNode = CategoryItem & {
  children: CategoryNode[];
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { message?: string } | null;
};

function buildTree(categories: CategoryItem[]) {
  const nodes = new Map<string, CategoryNode>();
  categories.forEach((category) =>
    nodes.set(category.id, { ...category, children: [] }),
  );

  const roots: CategoryNode[] = [];
  nodes.forEach((node) => {
    const parent = node.parentId ? nodes.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  return roots;
}

function flattenTree(
  nodes: CategoryNode[],
  depth = 0,
): Array<CategoryItem & { depth: number }> {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

function TreeNode({
  node,
  selectedId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: CategoryNode;
  selectedId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (category: CategoryItem) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded px-2 py-2 text-sm ${
          selectedId === node.id
            ? "bg-[#fff1f7] text-[#d62976]"
            : "hover:bg-zinc-50"
        }`}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className="grid size-7 place-items-center rounded text-zinc-500"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            <span className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node)}
          className="min-w-0 text-left"
        >
          <span className="block truncate font-black">{node.name}</span>
          <span className="block truncate text-xs font-medium text-zinc-500">
            {node.slug}
          </span>
        </button>
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-600">
          {node.productCount}
        </span>
      </div>
      {hasChildren && isExpanded ? (
        <div className="ml-6 border-l border-zinc-200 pl-2">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CategoryManager({
  initialCategories,
}: {
  initialCategories: CategoryItem[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState("");
  const [expanded, setExpanded] = useState(
    () => new Set(initialCategories.map((category) => category.id)),
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return categories;

    const directMatches = new Set(
      categories
        .filter((category) =>
          `${category.name} ${category.slug}`
            .toLowerCase()
            .includes(normalized),
        )
        .map((category) => category.id),
    );
    let changed = true;
    while (changed) {
      changed = false;
      categories.forEach((category) => {
        if (
          category.parentId &&
          directMatches.has(category.id) &&
          !directMatches.has(category.parentId)
        ) {
          directMatches.add(category.parentId);
          changed = true;
        }
      });
    }

    return categories.filter((category) => directMatches.has(category.id));
  }, [categories, query]);

  const tree = useMemo(
    () => buildTree(filteredCategories),
    [filteredCategories],
  );
  const allOptions = useMemo(
    () => flattenTree(buildTree(categories)),
    [categories],
  );
  const parentOptions = useMemo(
    () => [
      { value: "", label: "Root category", meta: "Top level", depth: 0 },
      ...allOptions.map((category) => ({
        value: category.id,
        label: category.name,
        meta: category.slug,
        depth: category.depth,
      })),
    ],
    [allOptions],
  );
  const selectedCategory = categories.find(
    (category) => category.id === selectedId,
  );

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      parentId: String(formData.get("parentId") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
    };

    const response = await apiFetch("/api/v1/dashboard/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as ApiEnvelope<CategoryItem>;
    setLoading(false);

    if (!response.ok || !body.success) {
      setError(body.error?.message ?? "Category could not be created.");
      return;
    }

    setCategories((current) => [...current, body.data]);
    setExpanded(
      (current) =>
        new Set(
          [...current, body.data.parentId ?? "", body.data.id].filter(Boolean),
        ),
    );
    setSelectedId(body.data.id);
    setSuccess("Category created.");
    form.reset();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded border border-zinc-200 bg-white">
        <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
          <h3 className="font-black">Category Tree</h3>
          <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-600">
            {categories.length} categories
          </span>
        </div>
        <div className="border-b border-zinc-200 p-4">
          <label className="flex h-10 items-center gap-2 rounded border border-zinc-200 px-3">
            <Search className="size-4 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full flex-1 text-sm font-medium outline-none"
              placeholder="Search categories"
            />
          </label>
        </div>
        <div className="max-h-[calc(100dvh-260px)] min-h-96 overflow-y-auto p-3">
          {tree.length ? (
            tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                expanded={expanded}
                onToggle={toggle}
                onSelect={(category) => setSelectedId(category.id)}
              />
            ))
          ) : (
            <div className="grid min-h-72 place-items-center px-6 text-center">
              <div>
                <Layers3 className="mx-auto size-8 text-zinc-400" />
                <p className="mt-3 text-base font-black">No categories found</p>
                <p className="mt-1 text-sm font-medium text-zinc-500">
                  Create a root category or search another term.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="rounded border border-zinc-200 bg-white">
        <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
          <h3 className="font-black">Create Category</h3>
          <span className="rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">
            Nested
          </span>
        </div>
        <form onSubmit={createCategory} className="grid gap-4 p-4">
          <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Selected parent
            </p>
            <p className="mt-1 text-sm font-black">
              {selectedCategory ? selectedCategory.name : "Root category"}
            </p>
          </div>
          <label className="grid gap-1 text-sm font-bold text-zinc-600">
            Name
            <input
              name="name"
              required
              className="h-10 rounded border border-zinc-200 px-3 font-medium text-zinc-950 outline-none focus:border-[#d62976]"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-zinc-600">
            Slug
            <input
              name="slug"
              className="h-10 rounded border border-zinc-200 px-3 font-medium text-zinc-950 outline-none focus:border-[#d62976]"
              placeholder="auto-generated if empty"
            />
          </label>
          <input type="hidden" name="parentId" value={selectedId} />
          <SearchableDropdown
            label="Parent"
            value={selectedId}
            options={parentOptions}
            onChange={setSelectedId}
            placeholder="Root category"
          />
          <label className="grid gap-1 text-sm font-bold text-zinc-600">
            Image URL
            <input
              name="imageUrl"
              className="h-10 rounded border border-zinc-200 px-3 font-medium text-zinc-950 outline-none focus:border-[#d62976]"
              placeholder="https://..."
            />
          </label>
          {error ? (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              {success}
            </p>
          ) : null}
          <button
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-[#d62976] px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <FolderPlus className="size-4" />
            {loading ? "Creating..." : "Create Category"}
          </button>
        </form>
      </aside>
    </div>
  );
}
