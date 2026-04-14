"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface AgreementData {
  id: string;
  pdf_url: string | null;
  status: string;
  terms: Record<string, unknown>;
}

interface MemberData {
  id: string;
  name: string;
  email: string;
  ownership_bps: number;
}

export default function SignAgreementPage() {
  const params = useParams();
  const router = useRouter();
  const syndicateId = params.id as string;
  const supabase = createClient();

  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [member, setMember] = useState<MemberData | null>(null);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(
          `/app/syndicate/${syndicateId}/join?redirectTo=/syndicate/${syndicateId}/sign`
        );
        return;
      }

      // Get member record
      const { data: memberData, error: memError } = await supabase
        .from("members")
        .select("id, name, email, ownership_bps")
        .eq("syndicate_id", syndicateId)
        .eq("user_id", user.id)
        .single();

      if (memError || !memberData) {
        // Try to link by email
        const { data: memberByEmail } = await supabase
          .from("members")
          .select("id, name, email, ownership_bps")
          .eq("syndicate_id", syndicateId)
          .eq("email", user.email)
          .single();

        if (memberByEmail) {
          // Link user_id to member
          await supabase
            .from("members")
            .update({ user_id: user.id, joined_at: new Date().toISOString() })
            .eq("id", memberByEmail.id);

          // Update invitation status
          await supabase
            .from("invitations")
            .update({ status: "accepted" })
            .eq("syndicate_id", syndicateId)
            .eq("email", user.email);

          setMember(memberByEmail);
        } else {
          setError("You are not a member of this syndicate.");
          setLoading(false);
          return;
        }
      } else {
        setMember(memberData);
      }

      // Get agreement
      const { data: agData } = await supabase
        .from("agreements")
        .select("id, pdf_url, status, terms")
        .eq("syndicate_id", syndicateId)
        .eq("type", "formation")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!agData) {
        setError("No agreement found for this syndicate.");
        setLoading(false);
        return;
      }

      setAgreement(agData);

      // Check if already signed
      const resolvedMemberId = memberData?.id || member?.id;
      if (resolvedMemberId) {
        const { data: existingSig } = await supabase
          .from("signatures")
          .select("id")
          .eq("agreement_id", agData.id)
          .eq("member_id", resolvedMemberId)
          .single();

        if (existingSig) {
          setAlreadySigned(true);
        }
      }

      setLoading(false);
    }

    load();
  }, [supabase, syndicateId, router, member?.id]);

  const handleSign = async () => {
    if (!agreement || !member) return;

    setSigning(true);
    setError(null);

    try {
      // Record signature with IP and user agent
      const { error: sigError } = await supabase.from("signatures").insert({
        agreement_id: agreement.id,
        member_id: member.id,
        ip_address: "collected-server-side", // Will be overridden by API if needed
        user_agent: navigator.userAgent,
      });

      if (sigError) {
        if (sigError.code === "23505") {
          // Unique violation - already signed
          setAlreadySigned(true);
        } else {
          throw sigError;
        }
      } else {
        setSigned(true);

        // Check if all members have signed
        const { count: sigCount } = await supabase
          .from("signatures")
          .select("id", { count: "exact", head: true })
          .eq("agreement_id", agreement.id);

        const { count: memberCount } = await supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("syndicate_id", syndicateId);

        if (sigCount === memberCount) {
          // All signed! Update statuses
          await supabase
            .from("agreements")
            .update({ status: "signed" })
            .eq("id", agreement.id);

          await supabase
            .from("syndicates")
            .update({ status: "active" })
            .eq("id", syndicateId);

          // Regenerate PDF with signatures
          await fetch("/api/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agreement_id: agreement.id }),
          });
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record signature"
      );
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading agreement...</div>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (alreadySigned || signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {alreadySigned ? "Already Signed" : "Agreement Signed!"}
          </h1>
          <p className="text-gray-600">
            {alreadySigned
              ? "You have already signed this agreement."
              : "Your signature has been recorded. You'll receive a copy of the fully signed agreement by email once all members have signed."}
          </p>
          {agreement?.pdf_url && (
            <a
              href={agreement.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              Download Agreement PDF
            </a>
          )}
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={() => router.push(`/app/syndicate/${syndicateId}`)}
            >
              View Syndicate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Review &amp; Sign Agreement
        </h1>
        <p className="text-gray-600 mb-6">
          {member?.name}, please review the co-ownership agreement below and
          confirm your acceptance.
        </p>

        {/* PDF Viewer */}
        {agreement?.pdf_url && (
          <div className="mb-6 rounded-lg border border-gray-200 overflow-hidden">
            <iframe
              src={agreement.pdf_url}
              className="w-full h-[600px]"
              title="Agreement PDF"
            />
          </div>
        )}

        {!agreement?.pdf_url && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">
              Agreement PDF is being generated. Please refresh in a moment.
            </p>
          </div>
        )}

        {/* GDPR Notice */}
        <div className="mb-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Privacy Notice (GDPR)
          </h3>
          <p className="text-sm text-gray-600">
            By clicking &quot;I Agree,&quot; your IP address, timestamp, and browser
            information will be recorded as evidence of your acceptance of this
            agreement. This data is collected under legitimate interest (Article
            6(1)(f) GDPR) to prove contract acceptance. This data will be
            retained for the duration of the co-ownership agreement and 5 years
            after dissolution, in accordance with Romanian commercial law record
            retention requirements. You may contact us at privacy@tailstake.com
            for data access or deletion requests.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Sign Button */}
        <div className="flex justify-center">
          <Button onClick={handleSign} loading={signing} size="lg">
            I Agree to These Terms
          </Button>
        </div>
      </div>
    </div>
  );
}
