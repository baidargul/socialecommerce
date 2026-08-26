import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { FollowButton } from "@/components/profile/follow-button";
import { PublicProfileTabs } from "@/components/profile/public-profile-tabs";
import { SheetHost } from "@/components/sheets/sheet-host";
import { Avatar } from "@/components/ui/avatar";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { CategoryItem, DemoUser, FeedPost, Product } from "@/lib/types";
import { formatCompactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

type ProfileStats = {
  posts: number;
  products: number;
  followers: number;
  following: number;
};

type PublicProfile = {
  user: DemoUser;
  stats: ProfileStats;
  isFollowing: boolean;
  posts: FeedPost[];
  products: Product[];
};

type PublicProfileResponse = Omit<
  PublicProfile,
  "stats" | "posts" | "products"
> & {
  stats?: Partial<ProfileStats>;
  followerCount?: number;
  followingCount?: number;
  posts?: FeedPost[];
  products?: Product[];
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params;
  const { tab } = await searchParams;
  const cookieStore = await cookies();
  const sessionUser = await getSessionUser();
  const isOwner =
    sessionUser?.username.toLowerCase() === username.toLowerCase();
  const canCreateProducts = Boolean(isOwner && sessionUser);
  const canLoadManagerCategories = Boolean(
    isOwner && sessionUser && ["ADMIN", "VENDOR"].includes(sessionUser.role),
  );
  const [profileResponse, categoriesResponse] = await Promise.all([
    fetchBackend<PublicProfileResponse>(
      `/api/v1/profiles/${encodeURIComponent(username)}`,
      {
        headers: { cookie: cookieStore.toString() },
      },
    ),
    canLoadManagerCategories
      ? fetchBackend<{ items: CategoryItem[]; nextCursor: null }>(
          "/api/v1/dashboard/categories",
          { headers: { cookie: cookieStore.toString() } },
        )
      : Promise.resolve(null),
  ]);
  const profile = profileResponse
    ? {
        ...profileResponse,
        stats: {
          posts:
            profileResponse.stats?.posts ?? profileResponse.posts?.length ?? 0,
          products:
            profileResponse.stats?.products ??
            profileResponse.products?.length ??
            0,
          followers:
            profileResponse.stats?.followers ??
            profileResponse.followerCount ??
            0,
          following:
            profileResponse.stats?.following ??
            profileResponse.followingCount ??
            0,
        },
        posts: profileResponse.posts ?? [],
        products: profileResponse.products ?? [],
      }
    : null;
  const fallbackProfile =
    sessionUser?.username.toLowerCase() === username.toLowerCase()
      ? {
          user: {
            id: sessionUser.id,
            name: sessionUser.name,
            username: sessionUser.username,
            email: sessionUser.email,
            avatarUrl: sessionUser.avatarUrl,
            bio: "",
            role: sessionUser.role,
          },
          stats: {
            posts: 0,
            products: 0,
            followers: 0,
            following: 0,
          },
          isFollowing: false,
          posts: [],
          products: [],
        }
      : null;

  const publicProfile = profile ?? fallbackProfile;
  if (!publicProfile) notFound();

  const { user, stats, posts, products } = publicProfile;

  return (
    <MobileShell>
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back home"
            className="grid size-9 place-items-center rounded-full bg-zinc-100 text-zinc-700"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-black">Profile</h1>
        </div>
      </header>

      <section className="px-5 py-6">
        <div className="flex items-start gap-5">
          <Avatar
            src={user.avatarUrl}
            alt={user.username}
            size="lg"
            ring="active"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-3xl font-black">{user.name}</h2>
            <p className="mt-1 truncate text-lg font-bold text-zinc-500">
              @{user.username}
            </p>
            <span className="mt-2 inline-flex rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">
              {user.role}
            </span>
          </div>
        </div>
        {sessionUser?.id !== user.id ? (
          <FollowButton
            username={user.username}
            initialFollowers={stats.followers}
            initialIsFollowing={publicProfile.isFollowing}
            canFollow={Boolean(sessionUser)}
          />
        ) : null}

        <p className="mt-5 text-base font-medium leading-7 text-zinc-600">
          {user.bio || "No bio yet."}
        </p>

        <div className="mt-6 grid grid-cols-4 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-center">
          <div>
            <p className="text-2xl font-black">
              {formatCompactNumber(stats.posts)}
            </p>
            <p className="text-xs font-bold text-zinc-500">Posts</p>
          </div>
          <div>
            <p className="text-2xl font-black">
              {formatCompactNumber(stats.products)}
            </p>
            <p className="text-xs font-bold text-zinc-500">Products</p>
          </div>
          <div>
            <p className="text-2xl font-black">
              {formatCompactNumber(stats.followers)}
            </p>
            <p className="text-xs font-bold text-zinc-500">Followers</p>
          </div>
          <div>
            <p className="text-2xl font-black">
              {formatCompactNumber(stats.following)}
            </p>
            <p className="text-xs font-bold text-zinc-500">Following</p>
          </div>
        </div>
      </section>

      <PublicProfileTabs
        posts={posts}
        products={products}
        categories={categoriesResponse?.items ?? []}
        isOwner={isOwner}
        canCreateProducts={canCreateProducts}
        initialTab={tab === "products" ? "products" : "posts"}
      />
      <SheetHost />
    </MobileShell>
  );
}
