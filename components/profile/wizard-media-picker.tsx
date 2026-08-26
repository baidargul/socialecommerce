"use client";

import { ImagePlus, Star, X } from "lucide-react";

export type WizardMedia = {
  id: string;
  file: File;
  previewUrl: string;
  type: "image" | "video";
};

export function addWizardMedia(
  current: WizardMedia[],
  files: FileList | null,
): { media: WizardMedia[]; error: string } {
  if (!files?.length) return { media: current, error: "" };
  const accepted = Array.from(files).filter(
    (file) =>
      (file.type.startsWith("image/") || file.type.startsWith("video/")) &&
      file.size <= 50 * 1024 * 1024,
  );
  if (current.length + accepted.length > 8)
    return { media: current, error: "You can add up to 8 media files." };
  if (accepted.length !== files.length)
    return {
      media: current,
      error: "Choose images or videos smaller than 50 MB.",
    };
  return {
    error: "",
    media: [
      ...current,
      ...accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video/")
          ? ("video" as const)
          : ("image" as const),
      })),
    ],
  };
}

export function clearWizardMedia(media: WizardMedia[]) {
  media.forEach((item) => URL.revokeObjectURL(item.previewUrl));
}

export function WizardMediaPicker({
  media,
  onChange,
  error,
}: {
  media: WizardMedia[];
  onChange: (media: WizardMedia[], error?: string) => void;
  error?: string;
}) {
  function remove(id: string) {
    const removed = media.find((item) => item.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onChange(media.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-4">
      <label className="grid min-h-40 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center transition active:bg-zinc-100">
        <span>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#fff1f7] text-[#d62976]">
            <ImagePlus className="size-6" />
          </span>
          <span className="mt-3 block text-base font-black">
            Add photos or videos
          </span>
          <span className="mt-1 block text-xs font-medium text-zinc-500">
            Up to 8 files · 50 MB each
          </span>
        </span>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(event) => {
            const result = addWizardMedia(media, event.target.files);
            onChange(result.media, result.error);
            event.target.value = "";
          }}
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}

      {media.length ? (
        <div className="grid grid-cols-2 gap-3">
          {media.map((item, index) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <div className="relative aspect-square bg-zinc-100">
                {item.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <video
                    src={item.previewUrl}
                    className="size-full object-cover"
                    muted
                  />
                )}
                {index === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-zinc-700">
                    <Star className="size-3 fill-current" /> Primary
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/65 text-white"
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="truncate px-3 py-2 text-xs font-bold text-zinc-500">
                {item.file.name}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
