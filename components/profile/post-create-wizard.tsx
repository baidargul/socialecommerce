"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Link2, Send } from "lucide-react";
import type { FeedPost, Product } from "@/lib/types";
import { uploadFormData } from "@/lib/multipart-upload";
import { MobileWizardShell } from "@/components/profile/mobile-wizard-shell";
import { WizardUploadProgress } from "@/components/profile/wizard-upload-progress";
import {
  clearWizardMedia,
  WizardMediaPicker,
  type WizardMedia,
} from "@/components/profile/wizard-media-picker";

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
};

const steps = ["Media", "Content", "Review"];
const inputClass =
  "min-h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base font-medium outline-none transition focus:border-zinc-950";

export function PostCreateWizard({
  products,
  onClose,
  onCreated,
}: {
  products: Product[];
  onClose: () => void;
  onCreated: (post: FeedPost) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [media, setMedia] = useState<WizardMedia[]>([]);
  const mediaRef = useRef<WizardMedia[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [productId, setProductId] = useState("");
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const dirty = Boolean(
    media.length || caption.trim() || hashtags.length || productId,
  );
  const linkedProduct = products.find((product) => product.id === productId);

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(
    () => () => {
      clearWizardMedia(mediaRef.current);
    },
    [],
  );

  function addHashtag(value = hashtagInput) {
    const normalized = value
      .trim()
      .replace(/^#/, "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (!normalized || hashtags.includes(normalized)) return;
    if (hashtags.length >= 30) {
      setError("You can add up to 30 hashtags.");
      return;
    }
    setHashtags((current) => [...current, normalized]);
    setHashtagInput("");
    setError("");
  }

  function next() {
    setError("");
    if (step === 1 && !caption.trim()) {
      setError("Write a caption before continuing.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function publish() {
    if (!caption.trim()) {
      setStep(1);
      setError("Write a caption before publishing.");
      return;
    }
    setPublishing(true);
    setUploadProgress(0);
    setError("");
    try {
      const formData = new FormData();
      formData.set("caption", caption.trim());
      formData.set("hashtags", JSON.stringify(hashtags));
      if (productId) formData.set("productId", productId);
      media.forEach((item) => formData.append("media", item.file));
      const { status, body } = await uploadFormData<ApiEnvelope<FeedPost>>(
        "/api/v1/posts",
        formData,
        setUploadProgress,
      );
      if (status < 200 || status >= 300 || !body.success || !body.data) {
        setUploadProgress(null);
        setError(body.error?.message ?? "Post could not be published.");
        return;
      }
      clearWizardMedia(media);
      mediaRef.current = [];
      onCreated(body.data);
      router.refresh();
      onClose();
    } catch {
      setUploadProgress(null);
      setError("Could not reach the post service.");
    } finally {
      setPublishing(false);
    }
  }

  const footer = (
    <div>
      <WizardUploadProgress progress={uploadProgress} action="Post" />
      <div className="flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            disabled={publishing}
            onClick={() => {
              setError("");
              setStep((current) => current - 1);
            }}
            className="min-h-12 flex-1 rounded-full bg-zinc-100 px-5 text-sm font-black text-zinc-800 disabled:opacity-50"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          disabled={publishing}
          onClick={step === steps.length - 1 ? () => void publish() : next}
          className="inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-[#d62976] px-5 text-sm font-black text-white disabled:opacity-50"
        >
          {step === steps.length - 1 ? (
            <>
              <Send className="size-4" />
              {publishing
                ? uploadProgress !== null && uploadProgress < 100
                  ? `Uploading ${uploadProgress}%`
                  : "Publishing..."
                : "Publish Post"}
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );

  return (
    <MobileWizardShell
      title="New Post"
      steps={steps}
      currentStep={step}
      dirty={dirty}
      busy={publishing}
      onBack={step > 0 ? () => setStep((current) => current - 1) : undefined}
      onClose={onClose}
      footer={footer}
    >
      {step === 0 ? (
        <section>
          <h3 className="text-2xl font-black">Choose media</h3>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Media is optional. Add photos or videos to make your post stand out.
          </p>
          <div className="mt-5">
            <WizardMediaPicker
              media={media}
              error={mediaError}
              onChange={(nextMedia, nextError = "") => {
                setMedia(nextMedia);
                setMediaError(nextError);
              }}
            />
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="grid gap-5">
          <div>
            <h3 className="text-2xl font-black">Tell your story</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Add a caption, hashtags, and optionally feature one of your
              products.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-bold text-zinc-800">
            Caption
            <textarea
              value={caption}
              onChange={(event) => {
                setCaption(event.target.value);
                setError("");
              }}
              maxLength={2200}
              rows={6}
              autoFocus
              placeholder="What do you want to share?"
              className={`${inputClass} resize-none py-3`}
            />
            <span className="text-right text-xs font-medium text-zinc-400">
              {caption.length}/2200
            </span>
          </label>

          <div className="grid gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-zinc-800">
              <Hash className="size-4" /> Hashtags
            </span>
            <div className="flex gap-2">
              <input
                value={hashtagInput}
                onChange={(event) => setHashtagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addHashtag();
                  }
                }}
                maxLength={40}
                placeholder="new-arrival"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => addHashtag()}
                className="shrink-0 rounded-2xl bg-zinc-100 px-4 text-sm font-black"
              >
                Add
              </button>
            </div>
            {hashtags.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {hashtags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setHashtags((current) =>
                        current.filter((item) => item !== tag),
                      )
                    }
                    className="rounded-full bg-[#fff1f7] px-3 py-1 text-xs font-black text-[#d62976]"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="grid gap-2 text-sm font-bold text-zinc-800">
            <span className="inline-flex items-center gap-2">
              <Link2 className="size-4" /> Feature a product
            </span>
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className={inputClass}
            >
              <option value="">No linked product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h3 className="text-2xl font-black">Ready to publish?</h3>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Review your post before sharing it with the community.
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {media[0] ? (
              <div className="aspect-square bg-zinc-100">
                {media[0].type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media[0].previewUrl}
                    alt="Post preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <video
                    src={media[0].previewUrl}
                    className="size-full object-cover"
                    controls
                  />
                )}
              </div>
            ) : null}
            <div className="p-4">
              <p className="whitespace-pre-wrap text-base font-medium leading-6">
                {caption}
              </p>
              {hashtags.length ? (
                <p className="mt-3 text-sm font-bold text-[#1768d8]">
                  {hashtags.map((tag) => `#${tag}`).join(" ")}
                </p>
              ) : null}
              {linkedProduct ? (
                <div className="mt-4 rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs font-bold text-zinc-500">
                    Featured product
                  </p>
                  <p className="mt-1 font-black">{linkedProduct.name}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </MobileWizardShell>
  );
}
