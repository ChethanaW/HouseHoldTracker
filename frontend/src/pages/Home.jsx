import ContributionForm from "../components/ContributionForm.jsx";

const styles = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem 1rem 4rem",
  },
  header: {
    width: "100%",
    maxWidth: "420px",
    marginBottom: "1.75rem",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "var(--color-text-primary)",
    letterSpacing: "-0.4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--color-text-secondary)",
    marginTop: "4px",
  },
};

export default function Home() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <span>🏠</span> Household Tracker
        </h1>
        <p style={styles.subtitle}>Log a shared expense in seconds</p>
      </header>
      <ContributionForm />
    </div>
  );
}
