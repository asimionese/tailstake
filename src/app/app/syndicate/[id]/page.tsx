"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { bpsToPercent, formatEUR } from "@/lib/validation";

interface SyndicateData {
  id: string;
  name: string;
  aircraft_tail_number: string;
  aircraft_type: string;
  aircraft_value: number;
  home_airfield: string;
  status: string;
}

interface MemberData {
  id: string;
  name: string;
  email: string;
  ownership_bps: number;
  role: string;
  user_id: string | null;
}

interface SignatureData {
  member_id: string;
  signed_at: string;
}

export default function SyndicateDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const syndicateId = params.id as string;
  const paymentStatus = searchParams.get("payment");
  const supabase = createClient();

  const [syndicate, setSyndicate] = useState<SyndicateData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [signatures, setSignatures] = useState<SignatureData[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get syndicate
      const { data: syn } = await supabase
        .from("syndicates")
        .select("*")
        .eq("id", syndicateId)
        .single();

      if (syn) setSyndicate(syn);

      // Get members
      const { data: mems } = await supabase
        .from("members")
        .select("*")
        .eq("syndicate_id", syndicateId)
        .order("role", { ascending: true });

      if (mems) setMembers(mems);

      // Get agreement + signatures
      const { data: agreement } = await supabase
        .from("agreements")
        .select("id, pdf_url")
        .eq("syndicate_id", syndicateId)
        .eq("type", "formation")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (agreement) {
        setPdfUrl(agreement.pdf_url);

        const { data: sigs } = await supabase
          .from("signatures")
          .select("member_id, signed_at")
          .eq("agreement_id", agreement.id);

        if (sigs) setSignatures(sigs);
      }

      setLoading(false);
    }

    load();
  }, [supabase, syndicateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading syndicate...</div>
      </div>
    );
  }

  if (!syndicate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Syndicate not found.</div>
      </div>
    );
  }

  const signedMemberIds = new Set(signatures.map((s) => s.member_id));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Payment success banner */}
        {paymentStatus === "success" && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">
              <strong>Payment received!</strong> Your agreement is being
              generated and invitations are being sent to co-owners.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {syndicate.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {syndicate.aircraft_tail_number} · {syndicate.aircraft_type}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              syndicate.status === "active"
                ? "bg-green-100 text-green-800"
                : syndicate.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {syndicate.status}
          </span>
        </div>

        {/* Aircraft Details */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Aircraft
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Tail Number</dt>
              <dd className="text-sm font-medium text-gray-900">
                {syndicate.aircraft_tail_number}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Type</dt>
              <dd className="text-sm font-medium text-gray-900">
                {syndicate.aircraft_type}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Value</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatEUR(syndicate.aircraft_value)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Home Airfield</dt>
              <dd className="text-sm font-medium text-gray-900">
                {syndicate.home_airfield}
              </dd>
            </div>
          </dl>
        </div>

        {/* Cap Table */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cap Table
          </h2>
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {m.name}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {m.email}
                    </span>
                    {m.role === "initiator" && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Initiator
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">
                    {bpsToPercent(m.ownership_bps)}
                  </span>
                  {signedMemberIds.has(m.id) ? (
                    <span className="text-green-600 text-sm">✓ Signed</span>
                  ) : (
                    <span className="text-amber-600 text-sm">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Agreement
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {signatures.length} of {members.length} members have signed
              </p>
              {signatures.length === members.length && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  All members have signed. Syndicate is active!
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm">
                    Download PDF
                  </Button>
                </a>
              )}
              <Button
                size="sm"
                onClick={() =>
                  (window.location.href = `/app/syndicate/${syndicateId}/sign`)
                }
              >
                Sign Agreement
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
