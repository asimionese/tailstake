import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AgreementTerms } from "@/types/database";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const syndicateId = session.metadata?.syndicate_id;
    const wizardDataStr = session.metadata?.wizard_data;

    if (!syndicateId) {
      console.error("Missing syndicate_id in webhook metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    // Update payment status
    await supabase
      .from("payments")
      .update({ status: "completed" })
      .eq("stripe_session_id", session.id);

    // Parse wizard data for agreement terms
    let wizardData;
    try {
      wizardData = wizardDataStr ? JSON.parse(wizardDataStr) : null;
    } catch {
      console.error("Failed to parse wizard data");
    }

    if (wizardData) {
      // Build canonical terms
      const terms: AgreementTerms = {
        aircraft_tail_number: wizardData.aircraft.tail_number,
        aircraft_type: wizardData.aircraft.type,
        aircraft_value: wizardData.aircraft.value,
        home_airfield: wizardData.aircraft.airfield,
        rofr_window_days: wizardData.rules.rofr_window_days,
        voting_threshold_bps: wizardData.rules.voting_threshold_bps,
        monthly_dues_eur: wizardData.rules.monthly_dues_eur,
        members: wizardData.members,
      };

      // Create agreement
      const { data: agreement } = await supabase
        .from("agreements")
        .insert({
          syndicate_id: syndicateId,
          type: "formation",
          version: 1,
          terms,
          status: "draft",
        })
        .select("id")
        .single();

      if (agreement) {
        // Trigger PDF generation
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        try {
          await fetch(`${appUrl}/api/generate-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agreement_id: agreement.id }),
          });
        } catch (err) {
          console.error("PDF generation trigger failed:", err);
          // Non-fatal: PDF can be regenerated
        }

        // Send invitations to non-initiator members
        try {
          await fetch(`${appUrl}/api/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ syndicate_id: syndicateId }),
          });
        } catch (err) {
          console.error("Invitation trigger failed:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
