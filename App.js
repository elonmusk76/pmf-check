import { useState } from "react";

const STAGES = [
  { id: "idea", label: "Idea Stage", icon: "💡" },
  { id: "mvp", label: "MVP Built", icon: "🛠️" },
  { id: "early", label: "Early Users", icon: "👥" },
  { id: "growth", label: "Growing", icon: "📈" },
];

const SIGNALS = [
  { id: "retention", label: "Users come back on their own", weight: 3 },
  { id: "referral", label: "Users refer others without being asked", weight: 3 },
  { id: "pain", label: "Users say they'd be 'very disappointed' without it", weight: 3 },
  { id: "revenue", label: "People are paying (or would pay)", weight: 2 },
  { id: "niche", label: "You have a clear, specific target customer", weight: 2 },
  { id: "feedback", label: "Users give you unsolicited feedback / feature requests", weight: 2 },
  { id: "problem", label: "You personally experienced the problem you're solving", weight: 1 },
  { id: "competitors", label: "There are competitors (proves market exists)", weight: 1 },
];

export default function App() {
  const [step, setStep] = useState(0); // 0=form, 1=loading, 2=results
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState("");
  const [signals, setSignals] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const toggleSignal = (id) =>
    setSignals((prev) => ({ ...prev, [id]: !prev[id] }));

  const pmfScore = () => {
    const max = SIGNALS.reduce((s, sig) => s + sig.weight * 3, 0);
    const got = SIGNALS.reduce((s, sig) => s + (signals[sig.id] ? sig.weight * 3 : 0), 0);
    return Math.round((got / max) * 100);
  };

  const analyze = async () => {
    if (!idea.trim() || !stage) {
      setError("Please fill in your idea and select a stage.");
      return;
    }
    setError("");
    setStep(1);

    const checkedSignals = SIGNALS.filter((s) => signals[s.id]).map((s) => s.label);
    const score = pmfScore();

    const prompt = `You are a sharp startup advisor who specializes in Product-Market Fit (PMF).

A ${stage === "idea" ? "first-time" : ""} founder has this idea:
"${idea}"

Stage: ${STAGES.find((s) => s.id === stage)?.label}
PMF signals they have checked YES:
${checkedSignals.length > 0 ? checkedSignals.map((s) => `- ${s}`).join("\n") : "- None yet"}

Their self-assessed PMF score: ${score}/100

Give them:
1. A VERDICT (one punchy line: e.g. "Pre-PMF — but the bones are good." or "Strong signal, keep going!")
2. TOP 3 GAPS — what's missing most for PMF
3. TOP 3 ACTIONS — specific, actionable next steps to find PMF faster
4. A PMF PLAYBOOK — 1 tailored strategy (50-80 words) based on their specific idea and stage

Keep it direct, no fluff. Talk like a mentor who's seen 200 startups. Use plain english. Format with clear section headers.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("\n") || "";
      setResult({ text, score });
      setStep(2);
    } catch (e) {
      setError("Something went wrong. Try again.");
      setStep(0);
    }
  };

  const reset = () => {
    setStep(0);
    setIdea("");
    setStage("");
    setSignals({});
    setResult(null);
  };

  const scoreColor = (s) =>
    s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";

  const renderResult = () => {
    if (!result) return null;
    const lines = result.text.split("\n");
    return lines.map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
      const isHeader = /^\d\.|^[A-Z\s]{4,}:/.test(line.trim()) || line.startsWith("#");
      return (
        <p
          key={i}
          style={{
            margin: "4px 0",
            fontWeight: isHeader ? 700 : 400,
            fontSize: isHeader ? 13 : 14,
            color: isHeader ? "#f97316" : "#e2e8f0",
            letterSpacing: isHeader ? "0.05em" : 0,
            textTransform: isHeader ? "uppercase" : "none",
          }}
        >
          {line}
        </p>
      );
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36, zIndex: 1 }}>
        <div style={{ fontSize: 11, color: "#f97316", letterSpacing: "0.3em", marginBottom: 8 }}>
          STARTUP TOOL v1.0
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 48px)",
            fontWeight: 900,
            color: "#fff",
            margin: 0,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          PMF<span style={{ color: "#f97316" }}>.</span>CHECK
        </h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
          Cancel the noise. Find your fit.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 560,
          zIndex: 1,
        }}
      >
        {/* STEP 0 — FORM */}
        {step === 0 && (
          <div>
            {/* Idea input */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Your Idea / Product</label>
              <textarea
                rows={3}
                placeholder="e.g. An app that lets founders cancel a product's market fit test and get AI-powered suggestions for achieving PMF..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                style={textareaStyle}
              />
            </div>

            {/* Stage */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Current Stage</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStage(s.id)}
                    style={{
                      ...stageBtn,
                      borderColor: stage === s.id ? "#f97316" : "#1e1e2e",
                      background: stage === s.id ? "rgba(249,115,22,0.1)" : "#0f0f1a",
                      color: stage === s.id ? "#f97316" : "#64748b",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PMF Signals */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>PMF Signals You Have</label>
              <p style={{ color: "#475569", fontSize: 12, marginBottom: 12 }}>
                Check all that apply honestly.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SIGNALS.map((sig) => (
                  <button
                    key={sig.id}
                    onClick={() => toggleSignal(sig.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: signals[sig.id] ? "rgba(249,115,22,0.08)" : "#0f0f1a",
                      border: `1px solid ${signals[sig.id] ? "#f97316" : "#1e1e2e"}`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `2px solid ${signals[sig.id] ? "#f97316" : "#334155"}`,
                        background: signals[sig.id] ? "#f97316" : "transparent",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {signals[sig.id] && (
                        <span style={{ color: "#000", fontSize: 11, fontWeight: 900 }}>✓</span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: signals[sig.id] ? "#e2e8f0" : "#64748b" }}>
                      {sig.label}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: "#334155",
                        flexShrink: 0,
                      }}
                    >
                      {"★".repeat(sig.weight)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Score preview */}
            <div
              style={{
                background: "#0f0f1a",
                border: "1px solid #1e1e2e",
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "#64748b", fontSize: 12 }}>Self-assessed PMF Score</span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: scoreColor(pmfScore()),
                }}
              >
                {pmfScore()}
                <span style={{ fontSize: 14, color: "#334155" }}>/100</span>
              </span>
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{error}</p>
            )}

            <button onClick={analyze} style={submitBtn}>
              ANALYZE MY PMF →
            </button>
          </div>
        )}

        {/* STEP 1 — LOADING */}
        {step === 1 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 20, animation: "spin 1s linear infinite" }}>
              ⚙️
            </div>
            <p style={{ color: "#f97316", fontSize: 13, letterSpacing: "0.2em" }}>
              ANALYZING YOUR PMF...
            </p>
            <p style={{ color: "#334155", fontSize: 12, marginTop: 8 }}>
              Consulting 200 startup case studies
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* STEP 2 — RESULTS */}
        {step === 2 && result && (
          <div>
            {/* Score card */}
            <div
              style={{
                background: "#0f0f1a",
                border: `2px solid ${scoreColor(result.score)}`,
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: scoreColor(result.score),
                  lineHeight: 1,
                }}
              >
                {result.score}
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 11, letterSpacing: "0.15em" }}>
                  PMF SCORE
                </div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {result.score >= 70
                    ? "Strong Signals 🔥"
                    : result.score >= 40
                    ? "Getting Warmer 🌡️"
                    : "Pre-PMF Territory 🧪"}
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div
              style={{
                background: "#0f0f1a",
                border: "1px solid #1e1e2e",
                borderRadius: 12,
                padding: "20px 24px",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#f97316",
                  letterSpacing: "0.25em",
                  marginBottom: 16,
                }}
              >
                AI ADVISOR ANALYSIS
              </div>
              {renderResult()}
            </div>

            <button onClick={reset} style={{ ...submitBtn, background: "#0f0f1a", color: "#f97316", border: "1px solid #f97316" }}>
              ← ANALYZE ANOTHER IDEA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  color: "#f97316",
  letterSpacing: "0.2em",
  marginBottom: 10,
  fontWeight: 700,
};

const textareaStyle = {
  width: "100%",
  background: "#0f0f1a",
  border: "1px solid #1e1e2e",
  borderRadius: 8,
  padding: "12px 14px",
  color: "#e2e8f0",
  fontSize: 13,
  fontFamily: "'Courier New', monospace",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  lineHeight: 1.6,
};

const stageBtn = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "14px 12px",
  border: "1px solid",
  borderRadius: 10,
  cursor: "pointer",
  transition: "all 0.15s",
  fontFamily: "'Courier New', monospace",
};

const submitBtn = {
  width: "100%",
  padding: "16px",
  background: "#f97316",
  border: "none",
  borderRadius: 10,
  color: "#000",
  fontSize: 13,
  fontWeight: 900,
  letterSpacing: "0.15em",
  cursor: "pointer",
  fontFamily: "'Courier New', monospace",
};