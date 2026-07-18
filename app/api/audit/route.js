import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a senior brand and narrative strategist auditing a company's homepage. You will be given the visible text content extracted from a live homepage. Work only from what's actually there — never invent claims, proof points, or CTAs the page doesn't contain.

Do three things:

1. EXTRACT — pull out:
   - "headline": the main hero headline/value prop as it actually appears (or your best identification of it)
   - "subhead": the supporting line beneath it, if one exists

2. EVALUATE — score these exact eight categories, each 1-10, against this rubric:
   - "Clarity": can a first-time visitor state what this company does within 5 seconds?
   - "Positioning": is it clear who this is for and what category it belongs to (or is trying to redefine)?
   - "Differentiation": is it clear why this over the obvious alternative?
   - "Trust": are there credible signals (proof, specificity, social proof, security/compliance markers) vs. vague claims?
   - "Conversion": is the primary CTA obvious, singular, and low-friction?
   - "Audience specificity": does the copy speak to a specific buyer's specific problem, or is it generic enough to apply to any company?
   - "Proof strength": are claims backed by numbers, named customers, or specifics — or just adjectives?
   - "Voice consistency": does the tone stay consistent and deliberate across the visible copy?

   Every score needs a one-sentence "rationale" citing something specific from the extracted content — never a generic justification that could apply to any homepage.

3. PRIORITIZE — produce an "actionPlan" of the 3-5 highest-impact fixes, ranked by impact, each with:
   - "issue": the specific problem (named plainly, referencing the actual page content)
   - "recommendation": a concrete, specific fix — not generic advice like "improve clarity"

If the extracted content is too thin to evaluate honestly (e.g. mostly navigation, a loading page, or blocked content), say so directly in the headline field and give low scores with rationale explaining why, rather than fabricating an evaluation.

Respond with ONLY valid, parseable JSON in this exact shape — no markdown fences, no preamble, no text before or after the JSON object. If you quote or paraphrase text from the page inside a rationale, issue, or recommendation, do not use raw double quotes around it — use single quotes or drop the quotation marks entirely, and escape any double quote character you do use as \\". The entire response must be a single valid JSON object parseable by JSON.parse with no modification:
{"extracted": {"headline": "...", "subhead": "..."}, "categories": [{"name": "Clarity", "score": 7, "rationale": "..."}], "actionPlan": [{"issue": "...", "recommendation": "..."}]}`;

function extractVisibleText(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(h[1-6]|p|a|button|li|span|div)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();

  return text.slice(0, 9000);
}

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: "A homepage URL is required." },
        { status: 400 }
      );
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let pageHtml;
    try {
      const pageRes = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; BrandIntelligenceToolkit/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!pageRes.ok) {
        return NextResponse.json(
          {
            error: `Couldn't fetch that URL (status ${pageRes.status}). Confirm it's public and correct.`,
          },
          { status: 400 }
        );
      }
      pageHtml = await pageRes.text();
    } catch (fetchErr) {
      return NextResponse.json(
        {
          error:
            "Couldn't reach that URL. Check it's correct and publicly accessible, then try again.",
        },
        { status: 400 }
      );
    }

    const visibleText = extractVisibleText(pageHtml);

    if (!visibleText || visibleText.length < 40) {
      return NextResponse.json(
        {
          error:
            "That page returned almost no visible text — it may require JavaScript to render or be blocking automated requests.",
        },
        { status: 422 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Server is missing ANTHROPIC_API_KEY. Add it in your Vercel project's Environment Variables.",
        },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 3200,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `URL audited: ${targetUrl}\n\nExtracted visible page text:\n${visibleText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Anthropic API error (${response.status}): ${errText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "";
    let cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: the model may have added stray text before/after the JSON
      // object. Extract the substring from the first { to the last } and
      // retry once before giving up.
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        try {
          parsed = JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          console.error("JSON parse failed twice. Raw model output:", raw);
          return NextResponse.json(
            { error: "Model response wasn't valid JSON. Try again." },
            { status: 502 }
          );
        }
      } else {
        console.error("No JSON object found. Raw model output:", raw);
        return NextResponse.json(
          { error: "Model response wasn't valid JSON. Try again." },
          { status: 502 }
        );
      }
    }

    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      return NextResponse.json(
        { error: "Model response was missing the expected data." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
