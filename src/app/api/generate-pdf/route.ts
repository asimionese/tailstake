import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { AgreementDocument } from "@/lib/pdf/agreement-template";
import type { AgreementTerms } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { agreement_id } = await request.json();

    if (!agreement_id) {
      return NextResponse.json(
        { error: "Missing agreement_id" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Fetch agreement with terms
    const { data: agreement, error: agError } = await supabase
      .from("agreements")
      .select("id, syndicate_id, terms, status")
      .eq("id", agreement_id)
      .single();

    if (agError || !agreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      );
    }

    const terms = agreement.terms as AgreementTerms;

    // Fetch any existing signatures
    const { data: sigs } = await supabase
      .from("signatures")
      .select("member_id, signed_at, ip_address")
      .eq("agreement_id", agreement_id);

    // Map signatures to member names
    let signatures;
    if (sigs && sigs.length > 0) {
      const memberIds = sigs.map((s) => s.member_id);
      const { data: members } = await supabase
        .from("members")
        .select("id, name")
        .in("id", memberIds);

      const memberMap = new Map(members?.map((m) => [m.id, m.name]) || []);

      signatures = sigs.map((s) => ({
        name: memberMap.get(s.member_id) || "Unknown",
        signed_at: new Date(s.signed_at).toLocaleString("ro-RO"),
        ip_address: s.ip_address,
      }));
    }

    const generatedAt = new Date().toLocaleString("ro-RO", {
      timeZone: "Europe/Bucharest",
    });

    // Generate PDF
    const doc = React.createElement(AgreementDocument, {
      terms,
      signatures,
      generatedAt,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(doc as any);

    // Upload to Supabase Storage
    const fileName = `${agreement.syndicate_id}/${agreement_id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("agreements")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("PDF upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    // Get public URL (private bucket, signed URL)
    const { data: urlData } = await supabase.storage
      .from("agreements")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    const pdfUrl = urlData?.signedUrl || fileName;

    // Update agreement with PDF URL and status
    await supabase
      .from("agreements")
      .update({
        pdf_url: pdfUrl,
        status: "pending_signatures",
      })
      .eq("id", agreement_id);

    return NextResponse.json({ pdf_url: pdfUrl });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
