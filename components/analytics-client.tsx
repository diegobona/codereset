"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  initializeAnalytics,
  getAnalyticsOptOutServerSnapshot,
  getAnalyticsOptOutSnapshot,
  setAnalyticsOptOut,
  subscribeAnalyticsOptOut,
  trackEvent,
  type AnalyticsPageKind,
} from "@/lib/analytics/events";

export function AnalyticsBootstrap({
  page,
  guidePageview = false,
}: {
  page: AnalyticsPageKind;
  guidePageview?: boolean;
}) {
  useEffect(() => {
    initializeAnalytics(page);
    if (guidePageview) {
      trackEvent("guide_pageview", { page, device: undefined });
    }
  }, [guidePageview, page]);
  return null;
}

export function GuideDeskLink({ className }: { className?: string }) {
  return (
    <Link
      className={className}
      href="/#reset-desk"
      onClick={() => trackEvent("guide_to_desk_click", { page: "guide" })}
    >
      Back to reset desk <ArrowRight size={15} />
    </Link>
  );
}

export function PrivacyControls() {
  const disabled = useSyncExternalStore(
    subscribeAnalyticsOptOut,
    getAnalyticsOptOutSnapshot,
    getAnalyticsOptOutServerSnapshot,
  );

  function updateOptOut(nextDisabled: boolean) {
    setAnalyticsOptOut(nextDisabled);
  }

  return (
    <div className="privacy-controls">
      <p>
        Anonymous product analytics are currently <strong>{disabled ? "disabled" : "enabled"}</strong> in this browser.
      </p>
      {disabled ? (
        <button type="button" onClick={() => updateOptOut(false)}>
          Enable anonymous analytics
        </button>
      ) : (
        <button type="button" onClick={() => updateOptOut(true)}>
          Disable anonymous analytics
        </button>
      )}
    </div>
  );
}
