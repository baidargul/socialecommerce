"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/lib/types";

const IMAGE_DURATION_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const TAP_THRESHOLD_PX = 10;

type ProductMediaCarouselProps = {
  media: FeedPost["media"];
  alt: string;
  children?: ReactNode;
};

export function ProductMediaCarousel({
  media,
  alt,
  children,
}: ProductMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const activeMedia = media[activeIndex];
  const hasMultiple = media.length > 1;

  const cancelImageAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (!media.length) return;
      cancelImageAnimation();
      setProgress(0);
      setActiveIndex((nextIndex + media.length) % media.length);
    },
    [cancelImageAnimation, media.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrevious = useCallback(
    () => goTo(activeIndex - 1),
    [activeIndex, goTo],
  );

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.5);
      },
      { threshold: [0, 0.5, 1] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    cancelImageAnimation();
    if (!activeMedia || !isVisible) return;

    if (activeMedia.type === "image") {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const nextProgress = Math.min((now - startedAt) / IMAGE_DURATION_MS, 1);
        setProgress(nextProgress);

        if (nextProgress >= 1) {
          if (hasMultiple) goNext();
          return;
        }

        animationRef.current = window.requestAnimationFrame(tick);
      };

      animationRef.current = window.requestAnimationFrame(tick);
      return cancelImageAnimation;
    }

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => undefined);
    }

    return () => {
      video.pause();
    };
  }, [activeMedia, cancelImageAnimation, goNext, hasMultiple, isVisible]);

  useEffect(() => {
    if (activeMedia?.type !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [activeMedia?.type, isVisible]);

  function handleVideoProgress() {
    const video = videoRef.current;
    if (!video?.duration || Number.isNaN(video.duration)) return;
    setProgress(Math.min(video.currentTime / video.duration, 1));
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      Boolean(target.closest("button, a, input, textarea, select"))
    );
  }

  function handleMove(clientX: number, clientY: number) {
    if (!pointerStart.current || !hasMultiple) return;

    const deltaX = clientX - pointerStart.current.x;
    const deltaY = clientY - pointerStart.current.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY);
    if (isHorizontalSwipe) {
      setDragOffset(Math.max(-80, Math.min(80, deltaX * 0.35)));
    }
  }

  function handleRelease(clientX: number, clientY: number) {
    if (!pointerStart.current || !hasMultiple) {
      pointerStart.current = null;
      setDragOffset(0);
      return;
    }

    const deltaX = clientX - pointerStart.current.x;
    const deltaY = clientY - pointerStart.current.y;
    const horizontalSwipe =
      Math.abs(deltaX) >= SWIPE_THRESHOLD_PX &&
      Math.abs(deltaX) > Math.abs(deltaY);
    pointerStart.current = null;
    setDragOffset(0);

    if (horizontalSwipe) {
      suppressClick.current = true;
      if (deltaX < 0) goNext();
      else goPrevious();
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      return;
    }
  }

  function handleTap(clientX: number) {
    if (!hasMultiple || suppressClick.current || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const start = pointerStart.current;
    if (start && Math.abs(clientX - start.x) > TAP_THRESHOLD_PX) return;
    if (clientX < rect.left + rect.width / 2) goPrevious();
    else goNext();
  }

  return (
    <div
      ref={rootRef}
      className="relative aspect-square touch-pan-y overflow-hidden bg-zinc-100 select-none"
      onPointerDown={(event) => {
        if (isInteractiveTarget(event.target)) return;
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        handleMove(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => handleRelease(event.clientX, event.clientY)}
      onPointerCancel={() => {
        pointerStart.current = null;
        setDragOffset(0);
      }}
      onTouchStart={(event) => {
        if (isInteractiveTarget(event.target)) return;
        const touch = event.touches[0];
        pointerStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (touch) handleMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches[0];
        if (touch) handleRelease(touch.clientX, touch.clientY);
      }}
      onClick={(event) => {
        if (isInteractiveTarget(event.target)) return;
        handleTap(event.clientX);
      }}
    >
      <div
        className="absolute inset-0 transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${dragOffset}px)` }}
      >
        {activeMedia?.type === "video" ? (
          <video
            key={activeMedia.url}
            ref={videoRef}
            src={activeMedia.url}
            className="size-full object-cover"
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={handleVideoProgress}
            onTimeUpdate={handleVideoProgress}
            onEnded={() => {
              setProgress(1);
              if (hasMultiple) goNext();
            }}
          />
        ) : activeMedia ? (
          <Image
            key={activeMedia.url}
            src={activeMedia.url}
            alt={alt}
            fill
            sizes="430px"
            draggable={false}
            className="object-cover"
          />
        ) : null}
      </div>

      {hasMultiple ? (
        <>
          <div className="absolute inset-x-3 top-3 z-10 flex gap-1.5">
            {media.map((item, index) => {
              const filled =
                index < activeIndex ? 1 : index === activeIndex ? progress : 0;
              return (
                <div
                  key={`${item.url}-${index}`}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/35 shadow-sm"
                >
                  <div
                    className="h-full rounded-full bg-white transition-[width] duration-100 ease-linear"
                    style={{ width: `${filled * 100}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {media.map((item, index) => (
              <span
                key={`${item.url}-${index}-dot`}
                className={cn(
                  "size-2 rounded-full",
                  index === activeIndex ? "bg-white" : "bg-white/60",
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-20">
        {children}
      </div>
    </div>
  );
}
