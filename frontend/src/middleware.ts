import { updateSession } from "@lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - the root page (empty string after `/`)
     * - /join
     * - /api/join
     * - /api/user/update-tokens
     * - static assets under /public
     * - Next.js internals (_next/static, _next/image)
     * - favicon.ico
     * - common image extensions
     */
    "/((?!$|join$|api/join$|api/user/update-tokens$|public/|_next/static|_next/image|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
