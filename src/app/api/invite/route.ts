import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { syndicate_id } = await request.json();

    if (!syndicate_id) {
      return NextResponse.json(
        { error: "Missing syndicate_id" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Get syndicate details
    const { data: syndicate } = await supabase
      .from("syndicates")
      .select("id, name, aircraft_tail_number, aircraft_type, created_by")
      .eq("id", syndicate_id)
      .single();

    if (!syndicate) {
      return NextResponse.json(
        { error: "Syndicate not found" },
        { status: 404 }
      );
    }

    // Get members who are not the initiator (no user_id yet)
    const { data: members } = await supabase
      .from("members")
      .select("id, name, email, ownership_bps")
      .eq("syndicate_id", syndicate_id)
      .is("user_id", null);

    if (!members || members.length === 0) {
      return NextResponse.json({ message: "No invitations needed" });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const results = [];

    for (const member of members) {
      // Create invitation token
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const { error: invError } = await supabase.from("invitations").insert({
        syndicate_id,
        email: member.email,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

      if (invError) {
        console.error(`Failed to create invitation for ${member.email}:`, invError);
        continue;
      }

      // Send invitation email
      const joinUrl = `${appUrl}/app/syndicate/${syndicate_id}/join?token=${token}`;

      try {
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: member.email,
          subject: `You're invited to co-own ${syndicate.aircraft_tail_number}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Aircraft Co-Ownership Invitation</h2>
              <p>Hi ${member.name},</p>
              <p>You've been invited to join the <strong>${syndicate.name}</strong>
              co-ownership syndicate for aircraft <strong>${syndicate.aircraft_tail_number}</strong>
              (${syndicate.aircraft_type}).</p>
              <p>Your ownership share: <strong>${(member.ownership_bps / 100).toFixed(2)}%</strong></p>
              <p>Click the link below to review the agreement and sign:</p>
              <a href="${joinUrl}"
                 style="display: inline-block; background: #2563eb; color: white;
                        padding: 12px 24px; border-radius: 8px; text-decoration: none;
                        margin: 16px 0;">
                Review &amp; Sign Agreement
              </a>
              <p style="color: #666; font-size: 14px;">
                This invitation expires in 14 days. If the link doesn't work,
                copy and paste this URL: ${joinUrl}
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">
                TailStake.com — Aircraft co-ownership made simple.
              </p>
            </div>
          `,
        });

        results.push({ email: member.email, status: "sent" });
      } catch (emailErr) {
        console.error(`Failed to send email to ${member.email}:`, emailErr);
        results.push({ email: member.email, status: "failed" });
      }
    }

    return NextResponse.json({ invitations: results });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}
