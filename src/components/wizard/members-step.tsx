"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bpsToPercent } from "@/lib/validation";
import type { WizardDraft } from "@/types/database";
import type { MemberRole } from "@/types/database";

interface Props {
  data: WizardDraft;
  onChange: (data: WizardDraft) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Record<string, string>;
  initiatorEmail: string;
}

export function MembersStep({
  data,
  onChange,
  onNext,
  onBack,
  errors,
  initiatorEmail,
}: Props) {
  const members = data.members;

  const updateMember = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate last member's BPS
    if (field === "ownership_bps" && index !== members.length - 1) {
      const otherBps = updated
        .slice(0, -1)
        .reduce((sum, m) => sum + (m.ownership_bps || 0), 0);
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        ownership_bps: Math.max(0, 10000 - otherBps),
      };
    }

    onChange({ ...data, members: updated });
  };

  const addMember = () => {
    if (members.length >= 5) return;
    const currentBps = members.reduce((sum, m) => sum + m.ownership_bps, 0);
    onChange({
      ...data,
      members: [
        ...members,
        {
          name: "",
          email: "",
          ownership_bps: Math.max(0, 10000 - currentBps),
          role: "member" as MemberRole,
        },
      ],
    });
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return;
    if (index === 0) return; // Can't remove initiator
    const updated = members.filter((_, i) => i !== index);
    // Recalculate last member BPS
    const otherBps = updated
      .slice(0, -1)
      .reduce((sum, m) => sum + m.ownership_bps, 0);
    updated[updated.length - 1] = {
      ...updated[updated.length - 1],
      ownership_bps: Math.max(0, 10000 - otherBps),
    };
    onChange({ ...data, members: updated });
  };

  const totalBps = members.reduce((sum, m) => sum + (m.ownership_bps || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Co-Owners</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add the people who will co-own this aircraft. Ownership must total
          exactly 100%.
        </p>
      </div>

      {members.map((member, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {i === 0 ? "You (Initiator)" : `Co-Owner ${i + 1}`}
            </span>
            {i > 0 && members.length > 2 && (
              <button
                type="button"
                onClick={() => removeMember(i)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Full Name"
              placeholder="Ion Popescu"
              value={member.name}
              onChange={(e) => updateMember(i, "name", e.target.value)}
              error={errors[`members.${i}.name`]}
            />
            <Input
              label="Email"
              type="email"
              placeholder="ion@example.com"
              value={i === 0 ? initiatorEmail : member.email}
              onChange={(e) => updateMember(i, "email", e.target.value)}
              disabled={i === 0}
              error={errors[`members.${i}.email`]}
            />
          </div>

          <div>
            <Input
              label={`Ownership (${bpsToPercent(member.ownership_bps || 0)})`}
              type="number"
              placeholder="5000"
              value={member.ownership_bps || ""}
              onChange={(e) =>
                updateMember(i, "ownership_bps", Number(e.target.value))
              }
              error={errors[`members.${i}.ownership_bps`]}
              hint={
                i === members.length - 1
                  ? "Auto-calculated as remainder"
                  : "Basis points: 5000 = 50%"
              }
              disabled={i === members.length - 1 && members.length > 1}
            />
          </div>
        </div>
      ))}

      {errors["members"] && (
        <p className="text-sm text-red-600">{errors["members"]}</p>
      )}

      <div className="flex items-center justify-between">
        <div
          className={`text-sm font-medium ${totalBps === 10000 ? "text-green-600" : "text-red-600"}`}
        >
          Total: {bpsToPercent(totalBps)}{" "}
          {totalBps !== 10000 && `(need ${bpsToPercent(10000 - totalBps)} more)`}
        </div>

        {members.length < 5 && (
          <Button variant="secondary" size="sm" onClick={addMember}>
            + Add Co-Owner
          </Button>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={totalBps !== 10000}>
          Continue to Rules
        </Button>
      </div>
    </div>
  );
}
