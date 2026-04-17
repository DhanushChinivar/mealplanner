import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const TRIAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { subscriptionActive: true, subscriptionTier: true },
    });

    // If active subscription exists, grant access directly.
    if (profile?.subscriptionActive) {
      return NextResponse.json({
        subscriptionActive: true,
        hasAccess: true,
        onTrial: false,
        trialStarted: true,
        trialExpired: false,
        trialRemainingDays: 0,
      });
    }

    // No profile or no trial marker => no access until trial starts or subscription becomes active.
    if (!profile?.subscriptionTier?.startsWith("trial|")) {
      return NextResponse.json({
        subscriptionActive: false,
        hasAccess: false,
        onTrial: false,
        trialStarted: false,
        trialExpired: false,
        trialRemainingDays: 0,
      });
    }

    const trialStartRaw = profile.subscriptionTier.split("|")[1];
    const trialStart = trialStartRaw ? new Date(trialStartRaw) : null;
    if (!trialStart || Number.isNaN(trialStart.getTime())) {
      return NextResponse.json({
        subscriptionActive: false,
        hasAccess: false,
        onTrial: false,
        trialStarted: true,
        trialExpired: true,
        trialRemainingDays: 0,
        message: "Trial data is invalid. Please subscribe to continue.",
      });
    }

    const trialEndsAt = new Date(trialStart.getTime() + TRIAL_DAYS * MS_PER_DAY);
    const now = new Date();
    const remainingMs = trialEndsAt.getTime() - now.getTime();
    const onTrial = remainingMs > 0;
    const trialExpired = !onTrial;
    const trialRemainingDays = onTrial
      ? Math.max(1, Math.ceil(remainingMs / MS_PER_DAY))
      : 0;

    return NextResponse.json({
      subscriptionActive: false,
      hasAccess: onTrial,
      onTrial,
      trialStarted: true,
      trialExpired,
      trialRemainingDays,
      trialEndsAt: trialEndsAt.toISOString(),
      message: trialExpired
        ? "Your 7-day free trial has ended. Subscribe to continue."
        : undefined,
    });
  } catch (err: unknown) {
    console.error("check-subscription error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
