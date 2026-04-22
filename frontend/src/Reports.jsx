import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);

  // Fetch reports from backend
  const fetchReports = async () => {
    try {
      const res = await fetch(
        `${API}/reports?user_id=${user.username}`
      );
      const data = await res.json();

      // Sort latest to oldest
      const sorted = (data.reports || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setReports(sorted);
    } catch (err) {
      console.log("Report error:", err);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) fetchReports();
  }, [user]);

  // Listen for new expense updates (dynamic refresh)
  useEffect(() => {
    const handleUpdate = () => fetchReports();

    window.addEventListener("expenseUpdated", handleUpdate);

    return () => {
      window.removeEventListener("expenseUpdated", handleUpdate);
    };
  }, []);

  return (
    <div className="reports-page">
      <h2 className="reports-title">📊 Expense Reports</h2>

      {reports.length === 0 ? (
        <div className="empty">No data yet</div>
      ) : (
        <div className="reports-grid">
          {reports.map((r) => (
            <div key={r.expense_id} className="report-card">
              <div className="report-top">
                <span className="report-category">{r.category}</span>
                <span className="report-amount">₹{r.amount}</span>
              </div>

              <div className="report-desc">{r.description}</div>

              <div className="report-date">{r.date}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
