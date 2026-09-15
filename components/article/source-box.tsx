import Link from "next/link";
import type { ClaimEvidence } from "@/lib/content/load";

const statusNotes: Record<ClaimEvidence["factStatus"], string> = {
  official: "Directly supported by a first-party source.",
  observed: "Observed in a current product surface or account.",
  inference: "A clearly labeled conclusion drawn from cited evidence.",
  unknown: "Not confirmed by the available evidence.",
};

export function SourceBox({ evidence }: { evidence: ReadonlyArray<ClaimEvidence> }) {
  return (
    <section
      className="source-box"
      id="sources"
      aria-label="Sources and claim status"
    >
      <div className="source-box-heading">
        <span className="section-index">SOURCES</span>
        <h2>Evidence behind this guide</h2>
        <p>
          Each material claim keeps its own status, verification date, review
          deadline, and cited source.
        </p>
      </div>
      <div className="source-claims">
        {evidence.map((claim) => (
          <article
            className="source-claim"
            data-claim-id={claim.id}
            data-fact-status={claim.factStatus}
            key={claim.id}
          >
            <div className="source-claim-status">
              <strong>{claim.factStatus}</strong>
              <span>{statusNotes[claim.factStatus]}</span>
            </div>
            <p>{claim.statement}</p>
            <dl>
              <div>
                <dt>Checked</dt>
                <dd>Verified {claim.verifiedAt}</dd>
              </div>
              <div>
                <dt>Next review</dt>
                <dd>Review by {claim.reviewAfter}</dd>
              </div>
            </dl>
            <ul aria-label={`Sources for ${claim.id}`}>
              {claim.sources.map((source) => (
                <li key={source.id}>
                  {source.evidenceType === "web-page" ? (
                    <>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.publisher}
                      </a>
                      <span>{source.url}</span>
                    </>
                  ) : (
                    <>
                      <strong>{source.publisher}</strong>
                      <span>Product evidence retained by the maintainers</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="source-policy-links">
        Read our <Link href="/methodology">Methodology</Link> or report an issue
        through <Link href="/corrections">Corrections</Link>.
      </p>
    </section>
  );
}
