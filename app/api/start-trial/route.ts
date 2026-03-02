import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const TRIAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
    const nowIso = new Date().toISOString();
    const trialTier = `trial|${nowIso}`;

    const existing = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
      select: {
        id: true,
        subscriptionActive: true,
        subscriptionTier: true,
      },
    });

    if (existing?.subscriptionActive) {
      return NextResponse.json({
        message: "Subscription already active.",
        started: false,
      });
    }

    if (existing?.subscriptionTier?.startsWith("trial|")) {
      const trialStartRaw = existing.subscriptionTier.split("|")[1];
      const trialStart = trialStartRaw ? new Date(trialStartRaw) : null;
      const trialIsValid = trialStart && !Number.isNaN(trialStart.getTime());
      const trialEndsAt = trialIsValid
        ? new Date(trialStart.getTime() + TRIAL_DAYS * MS_PER_DAY)
        : null;
      const trialExpired = !trialEndsAt || trialEndsAt.getTime() <= Date.now();

      return NextResponse.json({
        message: trialExpired
          ? "Your free trial has already ended. Please subscribe to continue."
          : "Trial already started.",
        started: false,
        trialStarted: true,
        trialExpired,
      });
    }

    if (!existing) {
      await prisma.profile.create({
        data: {
          userId: clerkUser.id,
          email,
          subscriptionActive: false,
          subscriptionTier: trialTier,
          stripeSubscriptionId: null,
        },
      });
    } else {
      await prisma.profile.update({
        where: { userId: clerkUser.id },
        data: { subscriptionTier: trialTier },
      });
    }

    return NextResponse.json({
      message: "Trial started successfully.",
      started: true,
      trialStarted: true,
      trialExpired: false,
    });
  } catch (error: any) {
    console.error("start-trial error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Failed to start trial." },
      { status: 500 }
    );
  }
}
