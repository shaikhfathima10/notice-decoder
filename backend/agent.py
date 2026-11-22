import json, pathlib, re
from typing import TypedDict
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END

load_dotenv()
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0, timeout=40, max_retries=1)
RULES_DIR = pathlib.Path(__file__).parent / "data" / "rules"
DOC_TYPES = ["income_tax", "traffic_challan", "electricity_bill", "bank_loan", "property_tax", "other"]

class State(TypedDict, total=False):
    text: str
    language: str
    doc_type: str
    fields: dict
    rules: str
    explanation: str
    checklist: list
    steps: list

def _json(prompt: str) -> dict:
    out = llm.invoke(prompt).content
    m = re.search(r"\{.*\}", out, re.S)
    return json.loads(m.group(0)) if m else {}

def _log(s: State, msg: str) -> list:
    return s.get("steps", []) + [msg]

def classify(s: State):
    r = _json(f'Classify this Indian notice into one of {DOC_TYPES}. '
              f'Reply JSON {{"doc_type": "..."}}.\n\n{s["text"][:3000]}')
    t = r.get("doc_type", "other")
    t = t if t in DOC_TYPES else "other"
    return {"doc_type": t, "steps": _log(s, f"Classified document as {t}")}

def extract(s: State):
    r = _json('Extract from this notice. Reply JSON with keys: authority, reference_no, '
              'amount, deadline (YYYY-MM-DD or null), penalty, action_required. '
              f'Use null if absent. Do not guess.\n\n{s["text"][:4000]}')
    return {"fields": r, "steps": _log(s, f"Extracted fields: {', '.join(k for k, v in r.items() if v)}")}

def retrieve(s: State):
    f = RULES_DIR / f'{s["doc_type"]}.md'
    rules = f.read_text(encoding="utf-8") if f.exists() else ""
    return {"rules": rules, "steps": _log(s, f"Loaded {len(rules)} chars of rules for {s['doc_type']}")}

def explain(s: State):
    p = (f'Explain this notice to an ordinary person in simple {s["language"]}. '
         'Say what it is, what they must do, by when, and what happens if they ignore it. '
         'Use ONLY the notice text and the rules below. If unsure, say so.\n\n'
         f'FIELDS: {json.dumps(s["fields"])}\nRULES:\n{s["rules"]}\nNOTICE:\n{s["text"][:4000]}')
    return {"explanation": llm.invoke(p).content, "steps": _log(s, f"Wrote explanation in {s['language']}")}

def checklist(s: State):
    r = _json(f'Give 3-6 concrete next steps in {s["language"]} for this notice. '
              f'Reply JSON {{"checklist": ["..."]}}.\n\nFIELDS: {json.dumps(s["fields"])}\nRULES:\n{s["rules"]}')
    return {"checklist": r.get("checklist", []), "steps": _log(s, "Built next-steps checklist")}

g = StateGraph(State)
for name, fn in [("classify", classify), ("extract", extract), ("retrieve", retrieve),
                 ("explain", explain), ("checklist", checklist)]:
    g.add_node(name, fn)
g.set_entry_point("classify")
for a, b in [("classify", "extract"), ("extract", "retrieve"), ("retrieve", "explain"), ("explain", "checklist")]:
    g.add_edge(a, b)
g.add_edge("checklist", END)
graph = g.compile()

def draft_reply(fields: dict, doc_type: str, language: str) -> str:
    """Only called after the user approves drafting."""
    p = (f'Draft a short, polite reply letter in {language} to the authority for this {doc_type} notice. '
         f'Leave [placeholders] for anything unknown. FIELDS: {json.dumps(fields)}')
    return llm.invoke(p).content
