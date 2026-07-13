import type { SessionUser } from "../../lib/auth/token";

declare global {
  namespace Express {
    interface Request {
      authUser?: SessionUser;
      requestStartedAt?: number;
      requestId?: string;
    }
  }
}
export {};
