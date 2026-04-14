import { z } from "zod/v4";

export const aircraftSchema = z.object({
  tail_number: z
    .string()
    .min(1, "Tail number is required")
    .regex(/^[A-Z]{1,2}-[A-Z0-9]{1,5}$/i, "Format: YR-XXXX"),
  type: z.string().min(1, "Aircraft type is required"),
  value: z.number().positive("Value must be positive"),
  airfield: z.string().min(1, "Home airfield is required"),
});

export const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Valid email is required"),
  ownership_bps: z
    .number()
    .int()
    .min(1, "Must own at least 0.01%")
    .max(9999, "Cannot own 100%"),
  role: z.enum(["initiator", "member"]),
});

export const rulesSchema = z.object({
  rofr_window_days: z
    .number()
    .int()
    .min(7, "Minimum 7 days")
    .max(90, "Maximum 90 days"),
  voting_threshold_bps: z
    .number()
    .int()
    .min(5001, "Must be majority (>50%)")
    .max(10000, "Cannot exceed 100%"),
  monthly_dues_eur: z.number().min(0, "Cannot be negative"),
});

export const wizardSchema = z.object({
  aircraft: aircraftSchema,
  members: z
    .array(memberSchema)
    .min(2, "Minimum 2 co-owners")
    .max(5, "Maximum 5 co-owners")
    .refine(
      (members) => {
        const total = members.reduce((sum, m) => sum + m.ownership_bps, 0);
        return total === 10000;
      },
      { message: "Ownership must total exactly 100% (10000 BPS)" }
    )
    .refine(
      (members) => {
        const emails = members.map((m) => m.email.toLowerCase());
        return new Set(emails).size === emails.length;
      },
      { message: "Duplicate email addresses not allowed" }
    ),
  rules: rulesSchema,
});

export type WizardFormData = z.infer<typeof wizardSchema>;

// Helper: format BPS as percentage string
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

// Helper: format EUR
export function formatEUR(amount: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
