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

  return (
    <section className="alerts-section" id="alerts" aria-labelledby="alerts-title">
      <div className="shell alerts-grid">
        <div>
          <span className="section-index light">06 / COMING LATER</span>
          <h2 id="alerts-title">Alerts are planned<br /><em>for later.</em></h2>
          <p>CodeReset does not offer alert delivery today. We are validating the concept before opening access.</p>
        </div>
        <div className="price-card">
          <div className="price-head"><BellRing size={25} /><span>ALERTS ROADMAP</span></div>
          <ul>
            <li><Check size={16} /> Source verification is still being developed</li>
            <li><Check size={16} /> Delivery options will be announced after validation</li>
            <li><Check size={16} /> No sign-up or payment collection</li>
          </ul>
          <small>For now, use your local countdown and the clearly labeled product preview.</small>
        </div>
      </div>
    </section>
  );
}
