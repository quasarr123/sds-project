
import { useState } from "react";

export default function StudentDashboard() {
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = [
    "Academic Complex",
    "Auditorium / Mini Auditorium",
    "Department Classes",
    "Club Events",
  ];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={{ margin: 0 }}>Venue Booking System</h2>
        <span>Student Dashboard</span>
      </header>

      <main style={styles.main}>
        <h1>Welcome, Student!</h1>
        <p style={styles.subtitle}>
          Manage your venue bookings from one place.
        </p>

        {!showCategories ? (
          <div style={styles.card}>
            <h2>Book a Venue</h2>
            <p>Find and book a venue for your academic or college event.</p>
            <button
              style={styles.button}
              onClick={() => setShowCategories(true)}
            >
              Book Venue
            </button>
          </div>
        ) : (
          <div>
            <button
              style={styles.backButton}
              onClick={() => {
                setShowCategories(false);
                setSelectedCategory("");
              }}
            >
              ← Back to Dashboard
            </button>

            <h2 style={{ marginTop: 24 }}>Choose Venue Category</h2>
            <p style={styles.subtitle}>
              Select the type of venue you want to book.
            </p>

            <div style={styles.grid}>
              {categories.map((category) => (
                <button
                  key={category}
                  style={{
                    ...styles.categoryCard,
                    border:
                      selectedCategory === category
                        ? "2px solid #2563eb"
                        : "1px solid #e5e7eb",
                  }}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span style={styles.categoryIcon}>▣</span>
                  <span>{category}</span>
                  <span style={styles.arrow}>→</span>
                </button>
              ))}
            </div>

            {selectedCategory && (
              <div style={styles.selection}>
                <h3>{selectedCategory}</h3>
                <p>
                  You selected this category. Venue selection and availability
                  will be added next.
                </p>
                <button
                  style={styles.button}
                  onClick={() =>
                    alert(
                      `${selectedCategory} selected. Booking form will be added next.`
                    )
                  }
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
    color: "#111827",
  },
  header: {
    background: "#ffffff",
    padding: "20px 6%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
  },
  main: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "0 24px",
  },
  subtitle: {
    color: "#6b7280",
    lineHeight: 1.6,
  },
  card: {
    marginTop: 30,
    padding: 28,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    maxWidth: 500,
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
  },
  button: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    marginTop: 10,
  },
  backButton: {
    background: "transparent",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 15,
    padding: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginTop: 24,
  },
  categoryCard: {
    background: "#ffffff",
    borderRadius: 10,
    padding: 22,
    minHeight: 130,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    textAlign: "left",
    color: "#111827",
  },
  categoryIcon: {
    fontSize: 24,
    color: "#2563eb",
  },
  arrow: {
    color: "#2563eb",
    alignSelf: "flex-end",
    fontSize: 20,
  },
  selection: {
    marginTop: 24,
    padding: 24,
    background: "#ffffff",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
  },
};
