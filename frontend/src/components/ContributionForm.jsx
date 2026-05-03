import { useState } from "react";

const PEOPLE = ["Chethana", "Saumya"];
const CATEGORIES = ["Mortgage", "Property Tax", "Utilities"];

// Use Vite proxy in dev (no VITE_API_URL), or the deployed URL in prod
const API_BASE = import.meta.env.VITE_API_URL || "";

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    padding: "1.5rem",
    boxShadow: "var(--shadow-card)",
  },
  section: {
    marginBottom: "1.25rem",
  },
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    marginBottom: "8px",
  },
  toggleRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
  },
  catRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "6px",
  },
  divider: {
    height: "1px",
    background: "var(--color-border)",
    margin: "1.25rem 0",
  },
  amountWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  amountPrefix: {
    position: "absolute",
    left: "13px",
    fontSize: "18px",
    fontWeight: "500",
    color: "var(--color-text-secondary)",
    pointerEvents: "none",
    userSelect: "none",
  },
  amountInput: {
    width: "100%",
    paddingLeft: "30px",
    paddingRight: "12px",
    paddingTop: "11px",
    paddingBottom: "11px",
    fontSize: "22px",
    fontWeight: "600",
    letterSpacing: "-0.5px",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  noteInput: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-text-primary)",
    outline: "none",
    fontFamily: "inherit",
    resize: "none",
    height: "72px",
    lineHeight: "1.5",
    transition: "border-color 0.15s",
  },
  preview: {
    marginTop: "1rem",
    padding: "10px 12px",
    background: "var(--color-accent-light)",
    borderRadius: "var(--radius-md)",
    fontSize: "13px",
    color: "var(--color-text-secondary)",
    lineHeight: "1.6",
  },
  previewAmount: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--color-accent)",
  },
  submitBtn: {
    width: "100%",
    marginTop: "1.25rem",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "600",
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.1px",
    transition: "background 0.15s, transform 0.1s, opacity 0.15s",
  },
  toast: (type) => ({
    position: "fixed",
    bottom: "28px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    borderRadius: "var(--radius-lg)",
    fontSize: "14px",
    fontWeight: "500",
    background: type === "error" ? "var(--color-error-bg)" : "var(--color-success-bg)",
    color: type === "error" ? "var(--color-error-text)" : "var(--color-success-text)",
    border: `1px solid ${type === "error" ? "var(--color-error-text)" : "var(--color-success-text)"}`,
    whiteSpace: "nowrap",
    zIndex: 999,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    pointerEvents: "none",
  }),
};

// ── Toggle Button ─────────────────────────────────────────────────────────────

function ToggleBtn({ label, active, onClick, colorVars }) {
  const base = {
    padding: "9px 0",
    fontSize: "14px",
    fontWeight: active ? "600" : "400",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    textAlign: "center",
    border: "1px solid",
    transition: "all 0.13s",
    fontFamily: "inherit",
  };

  const themed = active && colorVars
    ? {
        background: `var(${colorVars.bg})`,
        borderColor: `var(${colorVars.border})`,
        color: `var(${colorVars.text})`,
      }
    : active
    ? {
        background: "var(--color-accent-light)",
        borderColor: "var(--color-accent)",
        color: "var(--color-accent)",
      }
    : {
        background: "var(--color-bg)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-secondary)",
      };

  return (
    <button style={{ ...base, ...themed }} onClick={onClick}>
      {label}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ContributionForm() {
  const [person, setPerson] = useState("Chethana");
  const [category, setCategory] = useState("Mortgage");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }
  const [focusedField, setFocusedField] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function reset() {
    setAmount("");
    setNote("");
  }

  function getTimestamp() {
    const now = new Date();
    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    });
    
    const parts = estFormatter.formatToParts(now);
    const getType = (type) => parts.find(p => p.type === type).value;
    const ms = parts.find(p => p.type === 'fractionalSecond')?.value || '000';
    return `${getType('year')}-${getType('month')}-${getType('day')}T${getType('hour')}:${getType('minute')}:${getType('second')}.${ms}Z`;
  } 

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }

    setLoading(true);

    const now = new Date();
    const ts = getTimestamp();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const payload = {
      person,
      category,
      amount: parseFloat(amount),
      note: note.trim(),
      timestamp: ts,
      monthKey,
    };

    try {
      const res = await fetch(`${API_BASE}/api/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      showToast("Entry logged ✓");
      reset();
    } catch (err) {
      const msg = err.message.includes("Failed to fetch")
        ? "Can't reach backend — is it running?"
        : err.message;
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const personColors = {
    Chethana: { bg: "--color-person-chethana", border: "--color-person-chethana-border", text: "--color-person-chethana-text" },
    Saumya: { bg: "--color-person-saumya", border: "--color-person-saumya-border", text: "--color-person-saumya-text" },
  };

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const showPreview = !!amount && parseFloat(amount) > 0;

  return (
    <>
      <div style={s.card}>
        {/* Person */}
        <div style={s.section}>
          <label style={s.label}>Who's paying?</label>
          <div style={s.toggleRow}>
            {PEOPLE.map((p) => (
              <ToggleBtn
                key={p}
                label={p}
                active={person === p}
                onClick={() => setPerson(p)}
                colorVars={personColors[p]}
              />
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={s.section}>
          <label style={s.label}>Category</label>
          <div style={s.catRow}>
            {CATEGORIES.map((c) => (
              <ToggleBtn key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
        </div>

        <div style={s.divider} />

        {/* Amount */}
        <div style={s.section}>
          <label style={s.label}>Amount</label>
          <div style={s.amountWrap}>
            <span style={s.amountPrefix}>$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => setFocusedField("amount")}
              onBlur={() => setFocusedField(null)}
              style={{
                ...s.amountInput,
                borderColor: focusedField === "amount" ? "var(--color-border-focus)" : "var(--color-border)",
              }}
            />
          </div>
        </div>

        {/* Note */}
        <div style={{ ...s.section, marginBottom: 0 }}>
          <label style={s.label}>
            Note{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "11px" }}>
              (optional)
            </span>
          </label>
          <textarea
            placeholder="e.g. April mortgage, hydro bill…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={() => setFocusedField("note")}
            onBlur={() => setFocusedField(null)}
            style={{
              ...s.noteInput,
              borderColor: focusedField === "note" ? "var(--color-border-focus)" : "var(--color-border)",
            }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div style={s.preview}>
            <span style={s.previewAmount}>${parseFloat(amount).toFixed(2)}</span>
            {" · "}
            {person} · {category} · {monthKey}
            {note.trim() && (
              <>
                <br />
                <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>{note.trim()}</span>
              </>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          style={{
            ...s.submitBtn,
            opacity: loading ? 0.6 : 1,
            background: loading ? "var(--color-text-muted)" : "var(--color-accent)",
          }}
          onClick={handleSubmit}
          disabled={loading}
          onMouseEnter={(e) => { if (!loading) e.target.style.background = "var(--color-accent-hover)"; }}
          onMouseLeave={(e) => { if (!loading) e.target.style.background = "var(--color-accent)"; }}
        >
          {loading ? "Logging…" : "Log Entry"}
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={s.toast(toast.type)}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
