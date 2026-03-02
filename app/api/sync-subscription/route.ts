import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadataUserId = session.metadata?.clerkUserId;
    const email = session.customer_details?.email ?? session.customer_email ?? "";
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
    const paid = session.payment_status === "paid" || session.status === "complete";

    const currentUserEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
    const sameUser =
      (metadataUserId && metadataUserId === clerkUser.id) ||
      (email && currentUserEmail && email.toLowerCase() === currentUserEmail.toLowerCase());

    if (!sameUser) {
      return NextResponse.json(
        { error: "Session does not belong to the signed-in user." },
        { status: 403 }
      );
    }

    if (!subscriptionId || !paid) {
      return NextResponse.json(
        { error: "Checkout session is not complete yet." },
        { status: 409 }
      );
    }

    await prisma.profile.upsert({
      where: { userId: clerkUser.id },
      update: {
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: session.metadata?.planType ?? null,
      },
      create: {
        userId: clerkUser.id,
        email: currentUserEmail || email || "unknown@example.com",
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: session.metadata?.planType ?? null,
      },
    });

    return NextResponse.json({ subscriptionActive: true });
  } catch (error: any) {
    console.error("sync-subscription error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Failed to sync subscription." },
      { status: 500 }
    );
  }
}
