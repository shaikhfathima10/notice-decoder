"use client";
import { useState } from "react";

const API = "http://localhost:8000";
const LANGS = ["English", "Telugu", "Hindi"];

interface AnalyzeResponse {
  ocr_confidence: number;
  low_confidence: boolean;
  doc_type: string;
  fields: Record<string, any>;
  explanation: string;
  checklist: string[];
  steps: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState("English");
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<AnalyzeResponse | null>(null);
  const [letter, setLetter] = useState("");

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setErr("");
    setRes(null);
    setLetter("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("language", lang);
    try {
      const r = await fetch(`${API}/analyze`, { method: "POST", body: fd });
      if (!r.ok) {
        let msg = "Something went wrong";
        try {
          const errData = await r.json();
          msg = errData.detail || msg;
        } catch {
          msg = `Server returned status ${r.status}`;
        }
        throw new Error(msg);
      }
      const data: AnalyzeResponse = await r.json();
      setRes(data);
    } catch (e: any) {
      setErr(e.message || "Failed to analyze document");
    } finally {
      setBusy(false);
    }
  }

  async function draft() {
    if (!res) return;
    setDrafting(true);
    try {
      const r = await fetch(`${API}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: res.fields || {},
          doc_type: res.doc_type || "other",
          language: lang,
        }),
      });
      if (!r.ok) {
        throw new Error("Failed to generate draft reply.");
      }
      const data = await r.json();
      setLetter(data.letter || "");
    } catch (e: any) {
      setErr(e.message || "Failed to draft reply");
    } finally {
      setDrafting(false);
    }
  }

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }
    if (!res?.explanation) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(res.explanation);
    u.lang = lang === "Telugu" ? "te-IN" : lang === "Hindi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(u);
  }

  const ink = "#14213D", teal = "#0F766E", line = "#D8DEE6";
  const box = {
    border: `1px solid ${line}`,
    borderRadius: 8,
    padding: 16,
    background: "#fff",
  } as const;

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "32px 16px",
        color: ink,
        fontFamily: "system-ui, sans-serif",
        background: "#F7F8FA",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0, fontWeight: 700 }}>
        Understand any government notice
      </h1>
      <p style={{ color: "#475569", marginTop: 8, marginBottom: 20 }}>
        Photograph or upload the notice. Get what it means, what to do, and by when.
      </p>

      <div
        style={{
          ...box,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${line}` }}
        >
          {LANGS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <button
          onClick={analyze}
          disabled={!file || busy}
          style={{
            background: busy ? "#94A3B8" : teal,
            color: "#fff",
            border: 0,
            borderRadius: 6,
            padding: "8px 16px",
            fontWeight: 600,
            cursor: !file || busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Reading notice…" : "Explain this notice"}
        </button>
      </div>

      {err && (
        <p
          style={{
            ...box,
            borderColor: "#EF4444",
            background: "#FEF2F2",
            color: "#B91C1C",
            marginTop: 16,
          }}
        >
          ⚠️ {err}
        </p>
      )}

      {res && (
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {res.low_confidence && (
            <p
              style={{
                ...box,
                borderColor: "#F59E0B",
                background: "#FFFBEB",
                color: "#B45309",
              }}
            >
              ⚠️ The photo had low OCR confidence ({res.ocr_confidence}%). Check the details below against your original notice.
            </p>
          )}

          <section style={box}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>What this notice says</h2>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{res.explanation}</p>
            <button
              onClick={speak}
              style={{
                marginTop: 12,
                background: "#E2E8F0",
                color: ink,
                border: 0,
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              🔊 Read aloud
            </button>
          </section>

          <section style={box}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Key details</h2>
            {res.fields &&
              Object.entries(res.fields).map(([k, v]) =>
                v !== null && v !== undefined && v !== "" ? (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <b style={{ textTransform: "capitalize" }}>
                      {k.replace(/_/g, " ")}:
                    </b>{" "}
                    {String(v)}
                  </div>
                ) : null
              )}
            {res.fields?.deadline && (
              <p style={{ marginTop: 12 }}>
                <a
                  href={`${API}/reminder?date=${encodeURIComponent(
                    String(res.fields.deadline)
                  )}&title=${encodeURIComponent("Notice deadline")}`}
                  style={{
                    color: teal,
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                  download="deadline.ics"
                >
                  📅 Add deadline to calendar
                </a>
              </p>
            )}
          </section>

          <section style={box}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>What to do next</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              {(res.checklist || []).map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <button
              onClick={draft}
              disabled={drafting}
              style={{
                marginTop: 12,
                background: drafting ? "#94A3B8" : teal,
                color: "#fff",
                border: 0,
                borderRadius: 6,
                padding: "8px 16px",
                fontWeight: 600,
                cursor: drafting ? "not-allowed" : "pointer",
              }}
            >
              {drafting ? "Drafting reply…" : "Draft a reply letter"}
            </button>
            {letter && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#F1F5F9",
                  borderRadius: 6,
                  border: `1px solid ${line}`,
                }}
              >
                <h3 style={{ marginTop: 0, fontSize: 16 }}>Draft Reply Letter:</h3>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {letter}
                </pre>
              </div>
            )}
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 12 }}>
              ℹ️ This is guidance, not legal advice.
            </p>
          </section>

          <section style={{ ...box, background: ink, color: "#E2E8F0" }}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>How the agent worked</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              {(res.steps || []).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </main>
  );
}
