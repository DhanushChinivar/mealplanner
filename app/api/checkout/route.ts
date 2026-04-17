import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { getPriceIdFromType } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType } = await request.json();

    if (!planType) {
      return NextResponse.json(
        { error: "Plan type is required." },
        { status: 400 }
      );
    }

    const allowedPlanTypes = ["week", "month", "year"];
    if (!allowedPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type." },
        { status: 400 }
      );
    }

    const priceId = getPriceIdFromType(planType);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID for the selected plan not found." },
        { status: 400 }
      );
    }

    const email = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
    const userId = clerkUser.id;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      mode: "subscription",
      metadata: { clerkUserId: userId, planType },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Checkout API Error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
