import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  ring?: "active" | "viewed" | "none";
};

const sizes = {
  sm: "size-9",
  md: "size-12",
  lg: "size-[70px]",
};

export function Avatar({ src, alt, size = "md", ring = "none" }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-zinc-100",
        sizes[size],
        ring === "active" && "p-[3px] bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-yellow-300",
        ring === "viewed" && "p-[3px] bg-zinc-300",
      )}
    >
      <span className="relative block size-full overflow-hidden rounded-full border-2 border-white bg-zinc-100">
        <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
      </span>
    </span>
  );
}
