import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/utils";

type ApiMeta = {
  requestId: string;
  timingMs: number;
  cache?: "hit" | "miss" | "demo";
  page?: unknown;
};

export function apiSuccess<T>(data: T, startedAt: number, init?: ResponseInit & { cache?: ApiMeta["cache"]; page?: unknown }) {
  return NextResponse.json({
    success: true,
    data,
    error: null,
    meta: {
      requestId: createRequestId(),
      timingMs: Date.now() - startedAt,
      cache: init?.cache,
      page: init?.page,
    },
  }, init);
}

export function apiError(code: string, message: string, startedAt: number, status = 400) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { code, message },
      meta: {
        requestId: createRequestId(),
        timingMs: Date.now() - startedAt,
      },
    },
    { status },
  );
}
