"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-url";

type FollowButtonProps = {
  username: string;
  initialFollowers: number;
  initialIsFollowing: boolean;
  canFollow: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
};

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json"))
    return (await response.json()) as ApiEnvelope<T>;
  return {
    success: false,
    data: null,
    error: { message: "The follow service returned an invalid response." },
  };
}

export function FollowButton({
  username,
  initialFollowers,
  initialIsFollowing,
  canFollow,
}: FollowButtonProps) {
  const router = useRouter();
  const [followers, setFollowers] = useState(initialFollowers);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggleFollow() {
    if (!canFollow) {
      router.push(`/login?next=${encodeURIComponent(`/profile/${username}`)}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(`/api/v1/profiles/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      const body = await readEnvelope<{
        isFollowing: boolean;
        followers: number;
      }>(response);
      if (!response.ok || !body.success || !body.data) {
        setError(body.error?.message ?? "Could not update follow status.");
        return;
      }

      setIsFollowing(body.data.isFollowing);
      setFollowers(body.data.followers);
      router.refresh();
    } catch {
      setError("Could not reach the follow service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <Button
        className={
          isFollowing
            ? "w-full bg-zinc-100 text-zinc-950 shadow-none"
            : "w-full bg-zinc-950 text-white"
        }
        icon={
          isFollowing ? (
            <UserCheck className="size-4" />
          ) : (
            <UserPlus className="size-4" />
          )
        }
        loading={loading}
        onClick={toggleFollow}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <p className="mt-2 text-center text-xs font-bold text-zinc-500">
        {followers.toLocaleString()} followers
      </p>
      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 p-3 text-center text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
