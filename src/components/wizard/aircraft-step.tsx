"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { WizardDraft } from "@/types/database";

interface Props {
  data: WizardDraft;
  onChange: (data: WizardDraft) => void;
  onNext: () => void;
  errors: Record<string, string>;
}

const COMMON_TYPES = [
  "Eurostar EV97",
  "Flight Design CTLS",
  "Tecnam P92",
  "Tecnam P2002",
  "Tecnam P2008",
  "Pipistrel Virus SW",
  "Pipistrel Alpha Trainer",
  "Cessna 150",
  "Cessna 172",
  "Piper PA-28",
  "Robin DR400",
  "Ikarus C42",
  "Rans S-6",
  "TL Ultralight Sting",
  "Aeroprakt A-22",
  "Other",
];

export function AircraftStep({ data, onChange, onNext, errors }: Props) {
  const update = (field: keyof WizardDraft["aircraft"], value: string | number) => {
    onChange({
      ...data,
      aircraft: { ...data.aircraft, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Aircraft Details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us about the aircraft your syndicate will co-own.
        </p>
      </div>

      <Input
        label="Tail Number"
        placeholder="YR-1234"
        value={data.aircraft.tail_number}
        onChange={(e) => update("tail_number", e.target.value.toUpperCase())}
        error={errors["aircraft.tail_number"]}
        hint="Romanian format: YR-XXXX"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Aircraft Type
        </label>
        <select
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          value={data.aircraft.type}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="">Select aircraft type...</option>
          {COMMON_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors["aircraft.type"] && (
          <p className="text-sm text-red-600">{errors["aircraft.type"]}</p>
        )}
      </div>

      <Input
        label="Aircraft Value (EUR)"
        type="number"
        placeholder="60000"
        value={data.aircraft.value || ""}
        onChange={(e) => update("value", Number(e.target.value))}
        error={errors["aircraft.value"]}
        hint="Current market value in EUR"
      />

      <Input
        label="Home Airfield"
        placeholder="LRBS (Baneasa)"
        value={data.aircraft.airfield}
        onChange={(e) => update("airfield", e.target.value)}
        error={errors["aircraft.airfield"]}
      />

      <div className="flex justify-end pt-4">
        <Button onClick={onNext}>Continue to Co-Owners</Button>
      </div>
    </div>
  );
}
