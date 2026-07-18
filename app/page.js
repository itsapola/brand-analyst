"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) {
      setError("Enter a homepage URL to audit.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const avgScore =
    result && result.categories && result.categories.length
      ? (
          result.categories.reduce((sum, c) => sum + c.score, 0) /
          result.categories.length
        ).toFixed(1)
      : null;

  return (
    <>
      <nav>
        <span className="brand">
          <a href="https://ashleypola.com"><svg className="navmark" viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="16" rx="13" ry="6" fill="none" stroke="var(--persimmon)" strokeWidth="2.4" transform="rotate(-28 16 16)" /><circle cx="16" cy="16" r="3.4" fill="var(--ink)" /><circle cx="27.3" cy="9.9" r="2.6" fill="var(--persimmon)" /></svg>Ashley Pola</a>
        </span>
        <a className="navback" href="https://ashleypola.com/tools.html">
          ← All tools
        </a>
      </nav>

      <div className="wrap">
        <section className="hero">
          <span className="eyebrow">Brand Intelligence Toolkit</span>
          <h1>
            See what your homepage is <span className="hl">actually</span>{" "}
            communicating.
          </h1>
          <p className="lede">
            A structured, evidence-led audit of clarity, positioning,
            differentiation, trust, and conversion — built for strategic
            review, not generic AI commentary. Homepage content only.
            Strategic conclusions require human review.
          </p>
        </section>

        <div className="process">
          <div className="pstep">
            <div className="pn">01 / Extract</div>
            <h4>Read the page</h4>
            <p>
              Retrieves visible headings, claims, proof points, and CTAs
              from the live homepage.
            </p>
          </div>
          <div className="pstep">
            <div className="pn">02 / Evaluate</div>
            <h4>Score the strategy</h4>
            <p>
              Scores eight strategic categories against an explicit,
              fixed rubric.
            </p>
          </div>
          <div className="pstep">
            <div className="pn">03 / Prioritize</div>
            <h4>Rank the fixes</h4>
            <p>
              Turns the findings into a focused, executive-ready action
              plan.
            </p>
          </div>
        </div>

        <form className="formcard" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="url">Public homepage URL</label>
            <input
              id="url"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="hint">
              Must be a publicly accessible page — no logins or gated
              content.
            </div>
          </div>

          <div className="formrow">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Running audit…" : "Run audit"}
            </button>
            {error && <span className="status err">{error}</span>}
            {loading && (
              <span className="status" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg className="spinner-star" viewBox="0 0 20 20" aria-hidden="true"><line x1="10" y1="1" x2="10" y2="19" /><line x1="1" y1="10" x2="19" y2="10" /><line x1="3.6" y1="3.6" x2="16.4" y2="16.4" /><line x1="16.4" y1="3.6" x2="3.6" y2="16.4" /></svg>
                Fetching the page, scoring against the rubric…
              </span>
            )}
          </div>
        </form>

        {result && (
          <>
            {result.extracted && (
              <div className="extract">
                <div className="sl">What the page is saying</div>
                <div className="headline">
                  {result.extracted.headline || "No clear headline found"}
                </div>
                {result.extracted.subhead && (
                  <div className="subhead">{result.extracted.subhead}</div>
                )}
              </div>
            )}

            {result.categories && result.categories.length > 0 && (
              <section className="results">
                <div className="kicker">
                  <span>Strategic scorecard</span>
                  <span className="ln"></span>
                  {avgScore && <span>Average {avgScore} / 10</span>}
                </div>

                <div className="scorecard">
                  {result.categories.map((c, i) => (
                    <div className="scorerow" key={i}>
                      <div className="scat">{c.name}</div>
                      <div className="sbar-track">
                        <div
                          className="sbar-fill"
                          style={{ width: `${(c.score / 10) * 100}%` }}
                        />
                      </div>
                      <div className="snum">{c.score}/10</div>
                      <div className="srationale">{c.rationale}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {result.actionPlan && result.actionPlan.length > 0 && (
              <section className="results">
                <div className="kicker">
                  <span>Action plan</span>
                  <span className="ln"></span>
                  <span>{result.actionPlan.length} items, ranked</span>
                </div>

                {result.actionPlan.map((a, i) => (
                  <div className="actionitem" key={i}>
                    <div className="anum">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h4>{a.issue}</h4>
                    <p>{a.recommendation}</p>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      <footer>
        <svg className="orbit-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16.5" fill="none" stroke="var(--persimmon)" strokeWidth="0.5" opacity="0.45" /><g stroke="var(--persimmon)" strokeWidth="0.6"><line x1="20" y1="2.5" x2="20" y2="6" /><line x1="20" y1="34" x2="20" y2="37.5" /><line x1="2.5" y1="20" x2="6" y2="20" /><line x1="34" y1="20" x2="37.5" y2="20" /><line x1="8" y1="8" x2="10.5" y2="10.5" /><line x1="29.5" y1="29.5" x2="32" y2="32" /><line x1="32" y1="8" x2="29.5" y2="10.5" /><line x1="10.5" y1="29.5" x2="8" y2="32" /></g><ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(-20 20 20)" /><ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(40 20 20)" /><circle cx="20" cy="20" r="2.5" /></svg>
        <span>Ashley Pola © 2026</span>
        <span>
          Homepage content only. Strategic conclusions require human
          review.
        </span>
      </footer>
    </>
  );
}
