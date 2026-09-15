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

export type Guide = {
  slug: "5-hour-limit" | "weekly-limit" | "banked-resets" | "check-codex-usage";
  eyebrow: string;
  title: string;
  description: string;
  answer: string;
  lastReviewed: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
  faqs: Array<{ question: string; answer: string }>;
  related: Array<Guide["slug"]>;
};

export const guides: Guide[] = [
  {
    slug: "5-hour-limit",
    eyebrow: "WINDOW NOTE / 01",
    title: "How the Codex 5-hour limit resets",
    description: "Understand the short Codex usage window, find its real reset time, and avoid starting the wrong countdown.",
    answer: "Your five-hour Codex window recovers at the account-specific time shown by Codex. Do not add five hours to the moment you open this page; copy the reset timestamp from your usage screen or status output and track that exact time.",
    lastReviewed: "2026-09-15",
    sections: [
      {
        heading: "Use the timestamp Codex gives you",
        paragraphs: [
          "A five-hour window describes the duration of a usage bucket, not a universal wall-clock schedule. Two users can check at the same moment and see different recovery times.",
          "CodeReset stores the timestamp you enter and turns it into a local countdown. When the clock reaches zero, return to Codex to confirm the meter actually recovered.",
        ],
      },
      {
        heading: "Read both meters",
        paragraphs: [
          "Short-term capacity and weekly capacity are separate constraints. Reaching either one can interrupt work even when the other still shows room.",
        ],
        bullets: [
          "Track the five-hour and weekly reset times separately.",
          "Treat remaining percentage as a share of the window, not a fixed message count.",
          "Re-check after a reset instead of assuming the displayed percentage is live.",
        ],
      },
      {
        heading: "Why usage can drain unevenly",
        paragraphs: [
          "Complex tasks, long context, higher reasoning effort, tools, and multi-agent work can consume quota at different rates. Request count alone is not a useful budget.",
        ],
      },
    ],
    faqs: [
      { question: "Does the five-hour window always reset five hours from now?", answer: "No. Use the reset time displayed for your account. Opening a tracker does not start or re-anchor the window." },
      { question: "Can CodeReset confirm the reset happened?", answer: "No. It can remind you at the stored time; your official Codex usage screen confirms the actual state." },
    ],
    related: ["weekly-limit", "check-codex-usage"],
  },
  {
    slug: "weekly-limit",
    eyebrow: "WINDOW NOTE / 02",
    title: "When does the Codex weekly limit reset?",
    description: "Find your account-specific weekly recovery time and plan work without assuming a universal Monday reset.",
    answer: "The Codex weekly limit resets on an account-specific schedule shown in your usage view. There is no reliable universal Monday or midnight reset to count down to, so use the exact date, time, and timezone displayed for your account.",
    lastReviewed: "2026-09-15",
    sections: [
      {
        heading: "There is no shared weekly clock",
        paragraphs: [
          "A weekly limit is often described as a seven-day window, but that does not mean every account recovers at the same local time. Advice that names one global weekday is likely describing one person's anchor.",
          "Save your own timestamp and include its timezone. If a source only shows an abbreviation such as CST, verify whether it means China Standard Time or Central Standard Time before relying on it.",
        ],
      },
      {
        heading: "Plan around the pressured window",
        paragraphs: [
          "If the weekly meter is lower than the short-term meter, the weekly window is usually the constraint worth planning around. Keep a buffer for reviews, fixes, and unexpected context growth.",
        ],
        bullets: [
          "Move critical work earlier than the final quota hours.",
          "Use a lighter model when the task permits it.",
          "Export a reminder shortly before the recorded recovery time.",
        ],
      },
      {
        heading: "After the countdown ends",
        paragraphs: [
          "A local timer does not read the meter again. Open Codex, confirm the current percentage, and update CodeReset if the account view changed.",
        ],
      },
    ],
    faqs: [
      { question: "Does every Codex account reset on Monday?", answer: "No. Weekly recovery times are account-specific; use the date shown by Codex." },
      { question: "Will a public reset change my weekly anchor?", answer: "Public events and personal windows are separate. Check your account after any public event rather than assuming how the private meter changed." },
    ],
    related: ["5-hour-limit", "banked-resets"],
  },
  {
    slug: "banked-resets",
    eyebrow: "RESET NOTE / 03",
    title: "Codex banked resets, explained",
    description: "Learn how a redeemable banked reset differs from recurring quota windows and public reset events.",
    answer: "A banked reset is a one-time account benefit that may be available for manual redemption. It is not your normal five-hour or weekly recovery, and it is not the same as a public global reset. Availability, eligibility, and expiry must be checked in your own Codex account.",
    lastReviewed: "2026-09-15",
    sections: [
      {
        heading: "Three reset concepts are easy to mix up",
        paragraphs: [
          "Normal quota windows recover on their own account schedule. Public resets are broader events. A banked reset is a separate item you may be able to use when it is strategically valuable.",
          "CodeReset tracks these as different objects because collapsing them into one countdown creates bad decisions.",
        ],
      },
      {
        heading: "Before redeeming one",
        paragraphs: [
          "Check how much weekly quota remains, when the normal window recovers, and whether the account UI shows an expiry. Product rules can change, so the action screen in Codex is more reliable than a screenshot or community post.",
        ],
        bullets: [
          "Confirm that the reset is visible on the account you intend to use.",
          "Read any eligibility or expiry language before redeeming.",
          "Record the meter before and after if you need to verify the effect.",
        ],
      },
      {
        heading: "Why CodeReset does not add a redeem button",
        paragraphs: [
          "A third-party guide should not imitate an account action it cannot safely perform. Redeem only through the official Codex interface available to your account.",
        ],
      },
    ],
    faqs: [
      { question: "Can old accounts claim past banked resets?", answer: "Do not assume so. Eligibility is account-specific and can change; your Codex usage interface is authoritative." },
      { question: "Can CodeReset redeem a reset for me?", answer: "No. CodeReset has no account connection and cannot change, bypass, or refill your quota." },
    ],
    related: ["weekly-limit", "check-codex-usage"],
  },
  {
    slug: "check-codex-usage",
    eyebrow: "STATUS NOTE / 04",
    title: "How to check remaining Codex usage",
    description: "Find the five-hour and weekly meters, understand the percentages, and create a private reset countdown.",
    answer: "Open the usage view available in your Codex client or account settings and look for both the short-term and weekly remaining percentages plus their reset timestamps. Paste only those quota lines into CodeReset, or enter the values manually if your client formats them differently.",
    lastReviewed: "2026-09-15",
    sections: [
      {
        heading: "Capture four pieces of information",
        paragraphs: [
          "For a complete reset desk, collect the remaining percentage and recovery timestamp for each of the two quota windows. Do not paste credentials, API keys, conversation text, or unrelated terminal output.",
        ],
        bullets: [
          "Five-hour percentage remaining.",
          "Five-hour reset date and time.",
          "Weekly percentage remaining.",
          "Weekly reset date and time.",
        ],
      },
      {
        heading: "Paste locally or use manual setup",
        paragraphs: [
          "The CodeReset parser recognizes clearly labeled five-hour and weekly lines with percentages and parseable timestamps. If your client uses a different layout, manual setup gives you the same countdown without guessing.",
          "Saved values remain in this browser's local storage. Clearing site data or using another device starts with an empty desk.",
        ],
      },
      {
        heading: "What remaining percentage means",
        paragraphs: [
          "The percentage is a share of the current allowance, not a published number of prompts. Different tasks can consume different amounts, so pace against time remaining rather than request count.",
        ],
      },
    ],
    faqs: [
      { question: "Does CodeReset upload pasted status text?", answer: "No. Parsing and storage happen in the browser in this first release." },
      { question: "Why did the parser miss my output?", answer: "Client formats change. Use manual setup and enter the exact values from your official usage screen." },
    ],
    related: ["5-hour-limit", "weekly-limit"],
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
