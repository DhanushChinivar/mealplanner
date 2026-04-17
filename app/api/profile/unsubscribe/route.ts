import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the user's current subscription record via Prisma
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile?.stripeSubscriptionId) {
      throw new Error("No active subscription found.");
    }

    if (!profile.subscriptionActive) {
      throw new Error("Subscription is already inactive.");
    }

    const subscriptionId = profile.stripeSubscriptionId;

    // Cancel the subscription in Stripe at period end — user retains access until then
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    );

    // Do NOT clear stripeSubscriptionId or subscriptionActive here.
    // The webhook (customer.subscription.deleted) will fire when the period ends
    // and will then clear the subscription data in the DB.

    return NextResponse.json({ subscription: canceledSubscription });
  } catch (error: any) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsubscribe." },
      { status: 500 }
    );
  }
}