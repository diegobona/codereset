import { ArrowRight, BellRing, Check } from "lucide-react";

type AlertOfferProps = {
  enabled: boolean;
};

export function AlertOffer({ enabled }: AlertOfferProps) {
  if (enabled) {
    return (
      <section className="alerts-section" id="alerts" aria-labelledby="alerts-title">
        <div className="shell alerts-grid">
          <div>
            <span className="section-index light">06 / EARLY ACCESS</span>
            <h2 id="alerts-title">The reset signal<br /><em>should find you.</em></h2>
            <p>When verified global signals land, CodeReset Pro will deliver them by email and SMS—without turning every rumor into an alarm.</p>
          </div>
          <div className="price-card">
            <div className="price-head"><BellRing size={25} /><span>PRO ALERTS</span></div>
            <div className="price"><strong>$9</strong><span>/ month</span></div>
            <ul>
              <li><Check size={16} /> Verified global reset alerts</li>
              <li><Check size={16} /> Email + SMS delivery</li>
              <li><Check size={16} /> Calendar reminders</li>
              <li><Check size={16} /> Quiet hours and timezone control</li>
            </ul>
            <a className="button button-primary full" href="mailto:hello@codereset.dev?subject=CodeReset%20Pro%20early%20access">
              Join early access <ArrowRight size={18} />
            </a>
            <small>No charge today. We&apos;ll only email about launch.</small>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
