import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  BellRing,
  CalendarClock,
  Check,
  CircleDot,
  Clock3,
  DatabaseZap,
  LockKeyhole,
  Radio,
  TerminalSquare,
} from "lucide-react";
import { BrandMark, Crosshair } from "@/components/icons";
import { ResetDesk } from "@/components/reset-desk";
import { faqs, guidePreviews, previewSignals } from "@/lib/content";

const resetTypes = [
  {
    index: "A",
    title: "Your quota window",
    tag: "ACCOUNT-SPECIFIC",
    text: "The five-hour and weekly meters attached to your account. Your Codex usage screen is the only source of truth.",
    icon: Clock3,
  },
  {
    index: "B",
    title: "Public reset event",
    tag: "GLOBAL SIGNAL",
    text: "A broader reset or usage boost announced publicly. It is useful context—not a promise about your private meter.",
    icon: Radio,
  },
  {
    index: "C",
    title: "Banked reset",
    tag: "REDEEMABLE",
    text: "A one-time reset that may appear for an eligible account. It is separate from both normal windows and global events.",
    icon: DatabaseZap,
  },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header shell">
        <Link className="brand" href="/" aria-label="CodeReset home">
          <BrandMark className="brand-mark" />
          <span>CodeReset</span>
          <span className="brand-suffix">.dev</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#reset-desk">Reset desk</a>
          <a href="#signal-log">Signal log</a>
          <a href="#field-manual">Field manual</a>
        </nav>
        <a className="header-cta" href="#alerts">
          Get reset alerts <ArrowDownRight size={16} />
        </a>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> Independent quota intelligence</div>
          <h1 id="hero-title">Know exactly when<br />you can <em>ship again.</em></h1>
          <p className="hero-lede">
            Turn your Codex usage screen into a private countdown. Watch public reset signals without confusing them with your account&apos;s real quota clock.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#reset-desk">
              Set my countdown <ArrowRight size={18} />
            </a>
            <a className="button button-ghost" href="#how-it-works">How resets work</a>
          </div>
          <div className="hero-proof" aria-label="Product principles">
            <span><LockKeyhole size={15} /> No sign-in</span>
            <span><TerminalSquare size={15} /> Paste /status</span>
            <span><CalendarClock size={15} /> Export reminder</span>
          </div>
        </div>

        <div className="console-wrap" aria-label="Illustrative quota console">
          <div className="console-orbit"><Crosshair /></div>
          <div className="console">
            <div className="console-topline">
              <span><i /> RESET DESK</span>
              <span>PREVIEW / LOCAL</span>
            </div>
            <div className="console-main">
              <span className="console-label">WEEKLY WINDOW</span>
              <strong>02:14:08</strong>
              <span className="console-caption">DAYS : HRS : MIN</span>
            </div>
            <div className="quota-row">
              <div>
                <span>QUOTA REMAINING</span>
                <b>41%</b>
              </div>
              <div className="meter" aria-label="Illustrative quota 41 percent">
                <span style={{ width: "41%" }} />
              </div>
            </div>
            <div className="console-grid">
              <div><span>PACE</span><b className="signal-green">STEADY</b></div>
              <div><span>SOURCE</span><b>YOUR INPUT</b></div>
              <div><span>STORAGE</span><b>THIS DEVICE</b></div>
            </div>
            <p className="console-note">Illustrative data — your countdown starts after you paste a real status.</p>
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div>
          <span>PERSONAL WINDOWS ≠ PUBLIC RESETS</span>
          <i>•</i>
          <span>NO ACCOUNT CONNECTION</span>
          <i>•</i>
          <span>SOURCE LABELS ON EVERY SIGNAL</span>
          <i>•</i>
          <span>PERSONAL WINDOWS ≠ PUBLIC RESETS</span>
        </div>
      </div>

      <section className="reset-desk-section shell" id="reset-desk" aria-labelledby="desk-title">
        <div className="section-heading heading-split">
          <div>
            <span className="section-index">01 / YOUR DESK</span>
            <h2 id="desk-title">Your reset clock.<br /><em>Not somebody else&apos;s.</em></h2>
          </div>
          <p>Paste the status Codex already gives you. We&apos;ll turn it into two clear meters, a live countdown, and a calendar reminder.</p>
        </div>
        <ResetDesk />
      </section>

      <section className="reset-types shell" id="how-it-works" aria-labelledby="types-title">
        <div className="section-heading">
          <span className="section-index">02 / THE DIFFERENCE</span>
          <h2 id="types-title">Three clocks.<br /><em>Zero guesswork.</em></h2>
        </div>
        <div className="type-grid">
          {resetTypes.map(({ index, title, tag, text, icon: Icon }) => (
            <article className="type-card" key={title}>
              <div className="type-top"><span>{index}</span><Icon size={23} strokeWidth={1.7} /></div>
              <span className="micro-tag">{tag}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="privacy-section" aria-labelledby="privacy-title">
        <div className="shell privacy-grid">
          <div className="privacy-art" aria-hidden="true">
            <div className="privacy-rings"><LockKeyhole /></div>
            <span>DEVICE / 01</span>
          </div>
          <div className="privacy-copy">
            <span className="section-index light">03 / PRIVACY FIRST</span>
            <h2 id="privacy-title">Your quota stays<br />on <em>your device.</em></h2>
            <p>CodeReset does not need an OpenAI login, browser extension, API key, or account connection to run your personal countdown.</p>
            <ul>
              <li><Check size={17} /> Status text is parsed in your browser</li>
              <li><Check size={17} /> Reset times live in local storage</li>
              <li><Check size={17} /> You can erase everything in one click</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="signal-section shell" id="signal-log" aria-labelledby="signal-title">
        <div className="section-heading heading-split">
          <div>
            <span className="section-index">04 / SIGNAL LOG</span>
            <h2 id="signal-title">Evidence first.<br /><em>Hype last.</em></h2>
          </div>
          <p>Every public event needs a source, timestamp, and confidence label. Until the live connectors ship, this surface stays honestly in preview mode.</p>
        </div>
        <div className="signal-board">
          <div className="signal-board-head">
            <span><CircleDot size={15} /> SOURCE MONITOR</span>
            <span className="preview-pill">PRODUCT PREVIEW</span>
          </div>
          {previewSignals.map((signal) => (
            <div className="signal-row" key={signal.title}>
              <span>{signal.time}</span>
              <strong>{signal.title}</strong>
              <span>{signal.detail}</span>
              <b data-state={signal.state}>{signal.state}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="manual-section shell" id="field-manual" aria-labelledby="manual-title">
        <div className="section-heading">
          <span className="section-index">05 / FIELD MANUAL</span>
          <h2 id="manual-title">The answers people<br /><em>search for at 2 AM.</em></h2>
        </div>
        <div className="guide-grid">
          {guidePreviews.map((guide) => (
            <Link href={`/guides/${guide.slug}`} className="guide-card" key={guide.slug}>
              <span>{guide.code}</span>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <span className="guide-link">Read field note <ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

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

      <section className="faq-section shell" aria-labelledby="faq-title">
        <div className="section-heading">
          <span className="section-index">07 / QUICK ANSWERS</span>
          <h2 id="faq-title">Before you ask.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary><span>{String(index + 1).padStart(2, "0")}</span>{faq.question}<b>+</b></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <div className="shell footer-grid">
          <div>
            <Link className="brand footer-brand" href="/">
              <BrandMark className="brand-mark" /><span>CodeReset</span><span className="brand-suffix">.dev</span>
            </Link>
            <p>The reset desk for people who ship with AI.</p>
          </div>
          <div>
            <span>PRODUCT</span><a href="#reset-desk">Reset desk</a><a href="#signal-log">Signal log</a><a href="#alerts">Alerts</a>
          </div>
          <div>
            <span>LEARN</span>{guidePreviews.slice(0, 3).map((guide) => <Link href={`/guides/${guide.slug}`} key={guide.slug}>{guide.title}</Link>)}
          </div>
        </div>
        <div className="shell footer-bottom">
          <p>CodeReset is an independent community project and is not affiliated with OpenAI. Codex and OpenAI are trademarks of their respective owners.</p>
          <span>© 2026 CODERESET.DEV</span>
        </div>
      </footer>
    </main>
  );
}
