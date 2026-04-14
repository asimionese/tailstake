"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bpsToPercent } from "@/lib/validation";
import type { WizardDraft } from "@/types/database";

interface Props {
  data: WizardDraft;
  onChange: (data: WizardDraft) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
}

export function RulesStep({ data, onChange, onNext, onBack, errors }: Props) {
  const update = (field: keyof WizardDraft["rules"], value: number) => {
    onChange({
      ...data,
      rules: { ...data.rules, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Syndicate Rules
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure the governance rules for your co-ownership agreement.
        </p>
      </div>

      <div className="space-y-1">
        <Input
          label="ROFR Window (days)"
          type="number"
          value={data.rules.rofr_window_days || ""}
          onChange={(e) => update("rofr_window_days", Number(e.target.value))}
          error={errors["rules.rofr_window_days"]}
        />
        <p className="text-sm text-gray-500">
          When a member wants to exit, other members have this many days to
          exercise their Right of First Refusal. Standard: 21 days.
        </p>
      </div>

      <div className="space-y-1">
        <Input
          label={`Voting Threshold (${bpsToPercent(data.rules.voting_threshold_bps || 0)})`}
          type="number"
          value={data.rules.voting_threshold_bps || ""}
          onChange={(e) =>
            update("voting_threshold_bps", Number(e.target.value))
          }
          error={errors["rules.voting_threshold_bps"]}
        />
        <p className="text-sm text-gray-500">
          Ownership percentage required for major decisions (maintenance,
          insurance changes). Must be more than 50%. Standard: 6667 (66.67%).
        </p>
      </div>

      <div className="space-y-1">
        <Input
          label="Monthly Dues (EUR)"
          type="number"
          value={data.rules.monthly_dues_eur || ""}
          onChange={(e) => update("monthly_dues_eur", Number(e.target.value))}
          error={errors["rules.monthly_dues_eur"]}
        />
        <p className="text-sm text-gray-500">
          Monthly contribution per member for insurance, hangar, and maintenance
          reserve. Set to 0 if handling separately.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-800">
          What these rules mean
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-700">
          <li>
            If someone wants out, others get{" "}
            {data.rules.rofr_window_days || "..."} days to buy their share first
          </li>
          <li>
            Major decisions need{" "}
            {bpsToPercent(data.rules.voting_threshold_bps || 0)} of ownership to
            agree
          </li>
          {data.rules.monthly_dues_eur > 0 && (
            <li>
              Each member pays EUR {data.rules.monthly_dues_eur}/month into the
              shared fund
            </li>
          )}
        </ul>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Review &amp; Pay</Button>
      </div>
    </div>
  );
}
