"use client";

import { Button } from "@/components/ui/button";
import { bpsToPercent, formatEUR } from "@/lib/validation";
import type { WizardDraft } from "@/types/database";

interface Props {
  data: WizardDraft;
  onBack: () => void;
  onPay: () => void;
  loading: boolean;
  error: string | null;
}

export function ReviewStep({ data, onBack, onPay, loading, error }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Review &amp; Pay
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Review your syndicate details before payment.
        </p>
      </div>

      {/* Aircraft */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Aircraft
        </h3>
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Tail Number</dt>
            <dd className="text-sm font-medium text-gray-900">
              {data.aircraft.tail_number}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Type</dt>
            <dd className="text-sm font-medium text-gray-900">
              {data.aircraft.type}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Value</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatEUR(data.aircraft.value)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Home Airfield</dt>
            <dd className="text-sm font-medium text-gray-900">
              {data.aircraft.airfield}
            </dd>
          </div>
        </dl>
      </div>

      {/* Members */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Co-Owners ({data.members.length})
        </h3>
        <div className="mt-2 space-y-2">
          {data.members.map((m, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{m.name}</span>
                <span className="text-gray-500 ml-2">{m.email}</span>
                {m.role === "initiator" && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    Initiator
                  </span>
                )}
              </div>
              <span className="font-medium text-gray-900">
                {bpsToPercent(m.ownership_bps)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Rules
        </h3>
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">ROFR Window</dt>
            <dd className="text-sm font-medium text-gray-900">
              {data.rules.rofr_window_days} days
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Voting Threshold</dt>
            <dd className="text-sm font-medium text-gray-900">
              {bpsToPercent(data.rules.voting_threshold_bps)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-600">Monthly Dues</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatEUR(data.rules.monthly_dues_eur)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Payment */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Formation Fee</h3>
            <p className="text-sm text-gray-600">
              One-time fee for syndicate formation and agreement generation
            </p>
          </div>
          <span className="text-2xl font-bold text-gray-900">EUR 199</span>
        </div>
      </div>

      {/* Non-refundable disclosure */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <p className="text-sm text-amber-800">
          <strong>Non-refundable.</strong> The formation fee is non-refundable
          once payment is processed. Ensure all co-owners are committed before
          paying.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={onPay} loading={loading} size="lg">
          Pay EUR 199 &amp; Generate Agreement
        </Button>
      </div>
    </div>
  );
}
