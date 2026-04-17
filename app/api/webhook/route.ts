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
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleCustomerSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: unknown) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }

  return NextResponse.json({});
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.clerkUserId;
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? "";

  if (!userId) {
    console.log("No Clerk User ID found in session metadata.");
    return;
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : session.subscription?.id ?? null;
  if (!subscriptionId) {
    console.log("No subscription ID found in session.");
    return;
  }

  try {
    await prisma.profile.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: session.metadata?.planType || null,
      },
      create: {
        userId,
        email: customerEmail,
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
  const sub = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription;
  const subscriptionId = typeof sub === "string" ? sub : sub?.id ?? null;

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
