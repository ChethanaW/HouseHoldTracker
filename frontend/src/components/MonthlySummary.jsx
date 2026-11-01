// Per-category "who paid what" for the selected month.
// Categories with sub-types (Utilities, Reno+Insu) list each type separately.

const s = {
  card: {
    width: "100%",
    maxWidth: "420px",
    marginTop: "16px",
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem 1.5rem",
    boxShadow: "var(--shadow-card)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "10px",
    marginBottom: "12px",
  },
  title: { fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" },
  count: { fontSize: "13px", color: "var(--color-text-secondary)" },
  muted: { color: "var(--color-text-muted)", fontSize: "13px" },
  category: {
    padding: "12px 0",
    borderTop: "1px solid var(--color-border)",
  },
  categoryHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "6px",
  },
  categoryName: { fontSize: "15px", fontWeight: 700, color: "var(--color-accent)" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    minHeight: "32px",
    fontSize: "14px",
  },
  itemName: { fontSize: "13px", fontWeight: 600, margin: "10px 0 6px" },
  itemPeople: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" },
  itemCell: {
    background: "var(--color-bg)",
    borderRadius: "var(--radius-md)",
    padding: "8px 10px",
  },
  cellPerson: { fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" },
  amount: { fontWeight: 600, marginRight: "8px" },
  retry: {
    marginTop: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    fontFamily: "inherit",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  },
};

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function Pill({ paid }) {
  return (
    <span
      style={{
        fontSize: "12px",
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: "99px",
        whiteSpace: "nowrap",
        background: paid ? "var(--color-success-bg)" : "var(--color-warn-bg)",
        color: paid ? "var(--color-success-text)" : "var(--color-warn-text)",
      }}
    >
      {paid ? "Paid" : "Not paid"}
    </span>
  );
}

function PersonStatus({ entry }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      {entry.paid && <span style={s.amount}>{money(entry.amount)}</span>}
      <Pill paid={entry.paid} />
    </span>
  );
}

const anyPaid = (people) => people.some((p) => p.paid);

// A category with sub-types is settled when every type has a payment;
// otherwise when either person has paid.
const isSettled = (cat) => (cat.items ? cat.items.every((i) => anyPaid(i.people)) : anyPaid(cat.people));

export default function MonthlySummary({ summary, loading, error, monthLabel, onRetry }) {
  const settled = summary.filter(isSettled).length;

  return (
    <section style={s.card} aria-label={`Summary for ${monthLabel}`}>
      <div style={s.header}>
        <h2 style={s.title}>Summary · {monthLabel}</h2>
        {!loading && !error && summary.length > 0 && (
          <span style={s.count}>{settled} of {summary.length} settled</span>
        )}
      </div>

      {loading ? (
        <div style={s.muted}>Loading…</div>
      ) : error ? (
        <div>
          <div style={s.muted}>Couldn’t load the summary.</div>
          <button style={s.retry} onClick={onRetry}>Try again</button>
        </div>
      ) : (
        summary.map((cat) => (
          <div key={cat.category} style={s.category}>
            <div style={s.categoryHead}>
              <span style={s.categoryName}>{cat.category}</span>
              {cat.items && (
                <span style={s.count}>
                  {cat.items.filter((i) => anyPaid(i.people)).length} of {cat.items.length} items paid
                </span>
              )}
            </div>

            {cat.items
              ? cat.items.map((item) => (
                  <div key={item.type}>
                    <div style={s.itemName}>{item.type}</div>
                    <div style={s.itemPeople}>
                      {item.people.map((entry) => (
                        <div key={entry.person} style={s.itemCell}>
                          <div style={s.cellPerson}>{entry.person}</div>
                          <PersonStatus entry={entry} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              : cat.people.map((entry) => (
                  <div key={entry.person} style={s.row}>
                    <span>{entry.person}</span>
                    <PersonStatus entry={entry} />
                  </div>
                ))}
          </div>
        ))
      )}
    </section>
  );
}
