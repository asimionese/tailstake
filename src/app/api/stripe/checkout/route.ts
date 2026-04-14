import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { syndicate_id, wizard_data } = await request.json();

    if (!syndicate_id) {
      return NextResponse.json(
        { error: "Missing syndicate_id" },
        { status: 400 }
      );
    }

    // Verify user owns this syndicate
    const { data: syndicate } = await supabase
      .from("syndicates")
      .select("id, name, aircraft_tail_number")
      .eq("id", syndicate_id)
      .eq("created_by", user.id)
      .single();

    if (!syndicate) {
      return NextResponse.json(
        { error: "Syndicate not found" },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "TailStake Syndicate Formation",
              description: `Formation agreement for ${syndicate.aircraft_tail_number}`,
            },
            unit_amount: 19900, // EUR 199.00 in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        syndicate_id,
        user_id: user.id,
        wizard_data: JSON.stringify(wizard_data),
      },
      success_url: `${appUrl}/app/syndicate/${syndicate_id}?payment=success`,
      cancel_url: `${appUrl}/app/syndicate/new?payment=cancelled&step=3`,
    });

    // Record payment
    await supabase.from("payments").insert({
      syndicate_id,
      member_id: null, // Will be linked after
      stripe_session_id: session.id,
      amount: 19900,
      currency: "eur",
      status: "pending",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
