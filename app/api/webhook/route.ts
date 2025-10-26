import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature || "", webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "invoice.payment_failed": {
        const session = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(session);
        break;
      }
      case "customer.subscription.deleted": {
        const session = event.data.object as Stripe.Subscription;
        await handleCustomerSubscriptionDeleted(session);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({});
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.clerkUserId;

  if (!userId) {
    console.log("No Clerk User ID found in session metadata.");
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.log("No subscription ID found in session.");
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: session.metadata?.planType || null,
      },
    });
  } catch (error) {
    console.log("Error updating user subscription in DB:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
const subscriptionId = (invoice as any).subscription as string;

  if (!subscriptionId) {
    console.log("No subscription ID found in invoice.");
    return;
  }

  let userId: string | undefined;

  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { userId: true },
    });

    if (!profile?.userId) {
      console.log("No profile found");
      return;
    }

    userId = profile.userId;
  } catch (error: any) {
    console.log("Error fetching profile:", error.message);
    return;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
      },
    });
  } catch (error) {
    console.log("Error updating user subscription in DB:", error);
  }
}

async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;
  if (!subscriptionId) {
    console.log("No subscription ID found in invoice.");
    return;
  }

  let userId: string | undefined;

  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { userId: true },
    });

    if (!profile?.userId) {
      console.log("No profile found");
      return;
    }

    userId = profile.userId;
  } catch (error: any) {
    console.log("Error fetching profile:", error.message);
    return;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
        stripeSubscriptionId: null,
        subscriptionTier: null,
      },
    });
  } catch (error) {
    console.log("Error updating user subscription in DB:", error);
  }
}
