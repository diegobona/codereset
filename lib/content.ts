import { loadGuides, type LoadedGuide } from "@/lib/content/load";

export const guidePreviews = [
  {
    slug: "5-hour-limit",
    code: "01 / WINDOW",
    title: "How the 5-hour limit resets",
    description: "Use the time in your account—not five hours from the moment you check.",
  },
  {
    slug: "weekly-limit",
    code: "02 / WEEKLY",
    title: "When the weekly limit resets",
    description: "Why there is no universal Monday reset, and where your real timestamp lives.",
  },
  {
    slug: "banked-resets",
    code: "03 / BANKED",
    title: "Banked resets, explained",
    description: "Separate a redeemable reset from your normal window and public reset events.",
  },
  {
    slug: "check-codex-usage",
    code: "04 / STATUS",
    title: "Check remaining Codex usage",
    description: "Read the two meters, paste status safely, and plan the rest of your workday.",
  },
] as const;

export const previewSignals = [
  {
    time: "SOURCE 01",
    title: "Official announcement feed",
    detail: "Connector pending",
    state: "standby",
  },
  {
    time: "SOURCE 02",
    title: "OpenAI service health",
    detail: "Connector pending",
    state: "standby",
  },
  {
    time: "LOCAL",
    title: "Personal quota countdown",
    detail: "Runs in your browser",
    state: "ready",
  },
] as const;

export const faqs = [
  {
    question: "Can CodeReset see my Codex account?",
    answer:
      "No. The first release has no account connection. Your pasted status and reset times stay in local browser storage.",
  },
  {
    question: "Is a public reset the same as my weekly reset?",
    answer:
      "No. Your personal five-hour and weekly windows are account-specific. A public reset is a separate event announced for a broader group of users.",
  },
  {
    question: "Does the countdown guarantee my quota has recovered?",
    answer:
      "No. It counts down to the time you provide. Codex Settings or your usage command remains the source of truth.",
  },
] as const;

export type Guide = LoadedGuide;

export const guides: Guide[] = loadGuides();

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
