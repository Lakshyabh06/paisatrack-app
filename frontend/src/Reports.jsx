import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);

  const getColor = (cat) => {
    if (cat.includes("Food")) return "#16a34a";
    if (cat.includes("Transport")) return "#3b82f6";
    if (cat.includes("Shopping")) return "#f59e0b";
    if (cat.includes("Health")) return "#ef4444";
    if (cat.includes("Entertainment")) return "#22c55e";
    return "#6b7280";
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API}/reports?user_id=${user.username}`);
      const data = await res.json();

      const sorted = (data.reports || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setReports(sorted);

      const sum = sorted.reduce((acc, item) => acc + item.amount, 0);
      setTotal(sum);
    } catch (err) {
      console.log("Report fetch error:", err);
    }
  };

  useEffect(() => {
    if (user) fetchReports();

    const refresh = () => fetchReports();
    window.addEventListener("expenseUpdated", refresh);

    return () => window.removeEventListener("expenseUpdated", refresh);
  }, [user]);

  return (
    <div>
      {/* 🔥 HEADER */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ marginBottom: "5px" }}>Reports</h1>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          Track and analyze all your expenses
        </p>
      </div>

      {/* 🔥 SUMMARY CARDS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Total Spent</div>
          <h2 style={{ margin: 0 }}>₹{total}</h2>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Transactions</div>
          <h2 style={{ margin: 0 }}>{reports.length}</h2>
        </div>
      </div>

      {/* 🔥 TABLE */}
      <div style={tableContainer}>
        {/* HEADER */}
        <div style={tableHeader}>
          <span>Description</span>
          <span>Category</span>
          <span>Date</span>
          <span>Amount</span>
        </div>

        {/* DATA */}
        {reports.length === 0 ? (
          <div style={emptyState}>
            No reports available
          </div>
        ) : (
          reports.map((r) => (
            <div key={r.expense_id} style={tableRow}>
              {/* DESCRIPTION */}
              <span style={{ fontWeight: "500" }}>
                {r.description}
              </span>

              {/* CATEGORY BADGE */}
              <span>
                <span
                  style={{
                    background: getColor(r.category),
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {r.category}
                </span>
              </span>

              {/* DATE */}
              <span style={{ color: "#6b7280" }}>
                {new Date(r.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>

              {/* AMOUNT */}
              <span style={{ fontWeight: "600" }}>
                ₹{r.amount}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* 🔥 STYLES */

const cardStyle = {
  flex: 1,
  background: "#ffffff",
  padding: "18px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const labelStyle = {
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "6px",
};

const tableContainer = {
  background: "#ffffff",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "14px 20px",
  background: "#f9fafb",
  fontWeight: "600",
  fontSize: "13px",
  color: "#6b7280",
};

const tableRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr",
  padding: "16px 20px",
  borderTop: "1px solid #f1f5f9",
  alignItems: "center",
  transition: "background 0.2s ease",
};

const emptyState = {
  padding: "30px",
  textAlign: "center",
  color: "#9ca3af",
};
