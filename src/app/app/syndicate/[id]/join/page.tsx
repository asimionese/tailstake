"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function JoinSyndicatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const syndicateId = params.id as string;
  const token = searchParams.get("token");

  const supabase = createClient();

  const [invitation, setInvitation] = useState<{
    email: string;
    status: string;
    syndicate_name: string;
    aircraft: string;
    ownership: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError("Invalid invitation link. No token provided.");
        setLoading(false);
        return;
      }

      // Check if user is already authed
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Already authenticated, redirect to signing page
        window.location.href = `/app/syndicate/${syndicateId}/sign`;
        return;
      }

      // Fetch invitation details
      const { data: inv, error: invError } = await supabase
        .from("invitations")
        .select("email, status, syndicate_id")
        .eq("token", token)
        .eq("syndicate_id", syndicateId)
        .single();

      if (invError || !inv) {
        setError("Invitation not found or expired.");
        setLoading(false);
        return;
      }

      if (inv.status === "expired") {
        setError("This invitation has expired. Contact the syndicate creator.");
        setLoading(false);
        return;
      }

      if (inv.status === "accepted") {
        // Already accepted, redirect to sign
        window.location.href = `/app/syndicate/${syndicateId}/sign`;
        return;
      }

      // Get syndicate details
      const { data: syndicate } = await supabase
        .from("syndicates")
        .select("name, aircraft_tail_number")
        .eq("id", syndicateId)
        .single();

      // Get member details
      const { data: member } = await supabase
        .from("members")
        .select("ownership_bps")
        .eq("syndicate_id", syndicateId)
        .eq("email", inv.email)
        .single();

      setInvitation({
        email: inv.email,
        status: inv.status,
        syndicate_name: syndicate?.name || "Unknown Syndicate",
        aircraft: syndicate?.aircraft_tail_number || "Unknown",
        ownership: member?.ownership_bps || 0,
      });
      setLoading(false);
    }

    loadInvitation();
  }, [supabase, syndicateId, token]);

  const handleSignIn = async () => {
    if (!invitation) return;
    setSending(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: invitation.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/syndicate/${syndicateId}/sign`,
      },
    });

    if (authError) {
      setError("Failed to send magic link. Please try again.");
      setSending(false);
      return;
    }

    setMagicLinkSent(true);
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Invitation Error
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-600">
            We sent a magic link to{" "}
            <strong>{invitation?.email}</strong>. Click it to sign in and review
            the agreement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Co-Ownership Invitation
          </h1>
        </div>

        <div className="space-y-4 mb-8">
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Syndicate</span>
              <span className="font-medium text-gray-900">
                {invitation?.syndicate_name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Aircraft</span>
              <span className="font-medium text-gray-900">
                {invitation?.aircraft}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Your Share</span>
              <span className="font-medium text-gray-900">
                {((invitation?.ownership || 0) / 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Sign in with your email to review the co-ownership agreement and add
          your signature.
        </p>

        <Input
          label="Email"
          type="email"
          value={invitation?.email || ""}
          disabled
          hint="This is the email the invitation was sent to"
        />

        <div className="mt-6">
          <Button
            onClick={handleSignIn}
            loading={sending}
            size="lg"
            className="w-full"
          >
            Sign In to Review Agreement
          </Button>
        </div>
      </div>
    </div>
  );
}
