"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AircraftStep } from "@/components/wizard/aircraft-step";
import { MembersStep } from "@/components/wizard/members-step";
import { RulesStep } from "@/components/wizard/rules-step";
import { ReviewStep } from "@/components/wizard/review-step";
import { aircraftSchema, memberSchema, rulesSchema } from "@/lib/validation";
import type { WizardDraft, MemberRole } from "@/types/database";

const STEPS = ["Aircraft", "Co-Owners", "Rules", "Review & Pay"];

const DEFAULT_DRAFT: WizardDraft = {
  step: 0,
  aircraft: { tail_number: "", type: "", value: 0, airfield: "" },
  members: [
    { name: "", email: "", ownership_bps: 5000, role: "initiator" as MemberRole },
    { name: "", email: "", ownership_bps: 5000, role: "member" as MemberRole },
  ],
  rules: {
    rofr_window_days: 21,
    voting_threshold_bps: 6667,
    monthly_dues_eur: 0,
  },
};

export default function NewSyndicatePage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardDraft>(DEFAULT_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [syndicateId, setSyndicateId] = useState<string | null>(null);

  // Check auth + load draft
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/?login=app");
        return;
      }
      setUserEmail(user.email || "");

      // Set initiator email
      setData((prev) => ({
        ...prev,
        members: prev.members.map((m, i) =>
          i === 0 ? { ...m, email: user.email || "" } : m
        ),
      }));

      // Check for existing draft
      const { data: drafts } = await supabase
        .from("syndicates")
        .select("id")
        .eq("created_by", user.id)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1);

      if (drafts && drafts.length > 0) {
        setSyndicateId(drafts[0].id);
        // Could load saved draft data here
      }
    }
    init();
  }, [supabase, router]);

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const newErrors: Record<string, string> = {};

      if (stepIndex === 0) {
        const result = aircraftSchema.safeParse(data.aircraft);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            newErrors[`aircraft.${issue.path.join(".")}`] = issue.message;
          });
        }
      } else if (stepIndex === 1) {
        // Validate each member
        data.members.forEach((member, i) => {
          const result = memberSchema.safeParse(member);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              newErrors[`members.${i}.${issue.path.join(".")}`] =
                issue.message;
            });
          }
        });

        // Validate total BPS
        const totalBps = data.members.reduce(
          (sum, m) => sum + m.ownership_bps,
          0
        );
        if (totalBps !== 10000) {
          newErrors["members"] = `Ownership must total 100%. Currently: ${(totalBps / 100).toFixed(2)}%`;
        }

        // Check duplicate emails
        const emails = data.members.map((m) => m.email.toLowerCase());
        const seen = new Set<string>();
        emails.forEach((email, i) => {
          if (seen.has(email) && email) {
            newErrors[`members.${i}.email`] = "Duplicate email";
          }
          seen.add(email);
        });
      } else if (stepIndex === 2) {
        const result = rulesSchema.safeParse(data.rules);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            newErrors[`rules.${issue.path.join(".")}`] = issue.message;
          });
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [data]
  );

  const next = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handlePay = async () => {
    if (!validateStep(2)) return;

    setLoading(true);
    setPayError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create or update syndicate in DB
      let currentSyndicateId = syndicateId;

      if (!currentSyndicateId) {
        const { data: syndicate, error: synError } = await supabase
          .from("syndicates")
          .insert({
            name: `${data.aircraft.tail_number} Syndicate`,
            aircraft_tail_number: data.aircraft.tail_number,
            aircraft_type: data.aircraft.type,
            aircraft_value: data.aircraft.value,
            home_airfield: data.aircraft.airfield,
            status: "draft",
            created_by: user.id,
          })
          .select("id")
          .single();

        if (synError) throw synError;
        currentSyndicateId = syndicate.id;
        setSyndicateId(currentSyndicateId);

        // Insert members
        const memberRows = data.members.map((m) => ({
          syndicate_id: currentSyndicateId!,
          user_id: m.email === user.email ? user.id : null,
          name: m.name,
          email: m.email,
          ownership_bps: m.ownership_bps,
          role: m.role,
          joined_at: m.email === user.email ? new Date().toISOString() : null,
        }));

        const { error: memError } = await supabase
          .from("members")
          .insert(memberRows);
        if (memError) throw memError;
      }

      // Create Stripe checkout session via API
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syndicate_id: currentSyndicateId,
          wizard_data: data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : "Payment failed. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Your Syndicate
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up your aircraft co-ownership agreement in minutes.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    i <= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:inline ${
                    i <= step ? "text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 w-8 sm:w-16 ${
                      i < step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          {step === 0 && (
            <AircraftStep
              data={data}
              onChange={setData}
              onNext={next}
              errors={errors}
            />
          )}
          {step === 1 && (
            <MembersStep
              data={data}
              onChange={setData}
              onNext={next}
              onBack={back}
              errors={errors}
              initiatorEmail={userEmail}
            />
          )}
          {step === 2 && (
            <RulesStep
              data={data}
              onChange={setData}
              onNext={next}
              onBack={back}
              errors={errors}
            />
          )}
          {step === 3 && (
            <ReviewStep
              data={data}
              onBack={back}
              onPay={handlePay}
              loading={loading}
              error={payError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
