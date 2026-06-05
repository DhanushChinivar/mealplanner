import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-up(.*)",
  "/subscribe(.*)",
  "/subscribe/success(.*)",
  "/api/checkout(.*)",
  "/api/stripe-webhook(.*)",
  "/api/check-subscription(.*)",
  "/api/start-trial(.*)",
  "/api/sync-subscription(.*)",
  "/api/webhook(.*)",
]);

const isMealPlanRoute = createRouteMatcher(["/mealplan(.*)"]);
const isProfileRoute = createRouteMatcher(["/profile(.*)"]);
const isSignUpRoute = createRouteMatcher(["/sign-up(.*)"]);

const TRIAL_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function hasAccess(meta: { subscriptionActive?: boolean; subscriptionTier?: string | null }): boolean {
  if (meta.subscriptionActive) return true;
  if (meta.subscriptionTier?.startsWith("trial|")) {
    const trialStart = new Date(meta.subscriptionTier.split("|")[1] ?? "");
    if (!isNaN(trialStart.getTime())) {
      return trialStart.getTime() + TRIAL_DAYS_MS > Date.now();
    }
  }
  return false;
}

export default clerkMiddleware(async (auth, req) => {
  const userAuth = await auth();
  const { userId, sessionClaims } = userAuth;
  const { origin } = req.nextUrl;

  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/sign-up", origin));
  }

  if (isSignUpRoute(req) && userId) {
    return NextResponse.redirect(new URL("/mealplan", origin));
  }

  if ((isMealPlanRoute(req) || isProfileRoute(req)) && userId) {
    const meta = (sessionClaims?.publicMetadata ?? {}) as {
      subscriptionActive?: boolean;
      subscriptionTier?: string | null;
    };

    // Fast path: subscription fields are present in the JWT — no network hop needed.
    // Fall back to Clerk's API only for existing users whose metadata hasn't been
    // populated yet (pre-migration). Once all users have gone through a subscription
    // event, this branch becomes unreachable.
    const metaPopulated =
      meta.subscriptionActive !== undefined || meta.subscriptionTier !== undefined;

    if (metaPopulated) {
      if (!hasAccess(meta)) {
        return NextResponse.redirect(new URL("/subscribe", origin));
      }
    } else {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const freshMeta = user.publicMetadata as {
          subscriptionActive?: boolean;
          subscriptionTier?: string | null;
        };
        if (!hasAccess(freshMeta)) {
          return NextResponse.redirect(new URL("/subscribe", origin));
        }
      } catch {
        return NextResponse.redirect(new URL("/subscribe", origin));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
