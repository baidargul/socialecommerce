"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import type { Story } from "@/lib/types";
import { cn } from "@/lib/utils";

const STORY_DURATION_MS = 5000;

export function StoriesBar({ stories }: { stories: Story[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeStory = activeIndex === null ? null : stories[activeIndex];
  const currentIndex = activeIndex ?? 0;

  useEffect(() => {
    if (activeIndex === null) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => {
        if (current === null) return null;
        const nextIndex = current + 1;
        return nextIndex < stories.length ? nextIndex : null;
      });
    }, STORY_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, stories.length]);

  return (
    <>
      <section className="border-b border-zinc-100 px-5 pb-5">
        <h1 className="mb-5 pt-5 text-[26px] font-black tracking-normal">Social Commerce</h1>
        <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1">
          {stories.map((story, index) => (
            <button key={story.id} className="grid w-[68px] shrink-0 justify-items-center gap-2" onClick={() => setActiveIndex(index)}>
              <Avatar src={story.creator.avatarUrl} alt={story.creator.username} size="lg" ring={story.viewed ? "viewed" : "active"} />
              <span className="w-full truncate text-center text-[13px] font-medium">{story.creator.username}</span>
            </button>
          ))}
        </div>
      </section>

      {activeStory ? (
        <div className="fixed inset-0 z-[60] mx-auto max-w-[430px] bg-black">
          <Image src={activeStory.mediaUrl} alt={activeStory.creator.username} fill sizes="430px" className="object-cover" priority />
          <div className="absolute inset-x-3 top-5 flex gap-1">
            {stories.map((story, index) => {
              const isComplete = index < currentIndex;
              const isActive = index === currentIndex;

              return (
                <div key={story.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/35">
                  <div
                    key={`${story.id}-${currentIndex}`}
                    className={cn("h-full rounded-full bg-white", isActive && "origin-left animate-story-progress")}
                    style={{
                      width: isComplete || isActive ? "100%" : "0%",
                      animationDuration: isActive ? `${STORY_DURATION_MS}ms` : undefined,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="absolute inset-x-5 top-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={activeStory.creator.avatarUrl} alt={activeStory.creator.username} size="sm" />
              <span className="text-xl font-black text-white drop-shadow">{activeStory.creator.username}</span>
            </div>
            <IconButton
              label="Close story"
              icon={<X className="size-9 drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]" />}
              className="text-white mix-blend-difference cursor-pointer"
              onClick={() => setActiveIndex(null)}
            />
          </div>
          <button aria-label="Previous story" className="absolute inset-y-24 left-0 w-1/2" onClick={() => setActiveIndex(Math.max(0, currentIndex - 1))} />
          <button
            aria-label="Next story"
            className="absolute inset-y-24 right-0 w-1/2"
            onClick={() => setActiveIndex(currentIndex + 1 < stories.length ? currentIndex + 1 : null)}
          />
          {activeStory.product ? (
            <div className={cn("absolute bottom-10 left-5 rounded-full bg-white px-4 py-3 text-sm font-black text-zinc-950")}>
              {activeStory.product.name} · ${activeStory.product.price}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
