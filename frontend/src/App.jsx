import { useEffect, useState } from "react";
import "./styles.css";
import Login from "./Login";
import { getCurrentUser, logout } from "./auth/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Reports from "./Reports";

const API = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  // Sukhpreet - Edit feature states added
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newAmount, setNewAmount] = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [page, setPage] = useState("dashboard");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState({});
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      u.getSession((err, session) => {
        if (err || !session.isValid()) setUser(null);
        else setUser(u);
      });
    } else setUser(null);
  }, []);

  const fetchExpenses = async () => {
    const res = await fetch(
      `${API}/expenses?user_id=${user.username}&month_year=2026-04`
    );
    const data = await res.json();
    setExpenses(data.expenses || []);
    setTotal(data.total || 0);
    setByCategory(data.by_category || {});
  };

  const fetchBudgets = async () => {
    const res = await fetch(`${API}/budgets?user_id=${user.username}`);
    const data = await res.json();
    setBudgets(data.budgets || []);
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchBudgets();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const TIMEOUT = 10 * 60 * 1000;
    let lastActivityTime = Date.now();

    const logoutUser = () => setSessionExpired(true);

    const checkTimeout = () => {
      if (Date.now() - lastActivityTime > TIMEOUT) logoutUser();
    };

    const resetTimer = () => (lastActivityTime = Date.now());

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    const interval = setInterval(checkTimeout, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkTimeout();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  const addExpense = async () => {
    if (!name || !amount) return;

    await fetch(`${API}/expense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.username,
        amount: Number(amount),
        category,
        description: name,
        date: new Date().toISOString().slice(0, 10),
      }),
    });

    setName("");
    setAmount("");
    fetchExpenses();
    window.dispatchEvent(new Event("expenseUpdated"));
  };

  const addBudget = async () => {
    if (!budgetAmount) return;

    await fetch(`${API}/budgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.username,
        category,
        amount: Number(budgetAmount),
        description: "Monthly budget",
        date: new Date().toISOString().slice(0, 10),
        type: "budget",
      }),
    });

    setBudgetAmount("");
    fetchBudgets();
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/expense/${id}?user_id=${user.username}`, {
        method: "DELETE",
      });
      fetchExpenses();
      window.dispatchEvent(new Event("expenseUpdated"));
    } catch (err) {
      console.log(err);
    }
  };

  // Sukhpreet - handleEdit updated: removed prompt, added UI form
  const handleEdit = (e) => {
    setEditData(e);
    setNewAmount(e.amount);
    setShowEdit(true);
  };

  const handleSave = async () => {
    try {
      await fetch(
        `${API}/expense/${editData.expense_id}?user_id=${user.username}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Number(newAmount),
            category: editData.category,
            description: editData.description,
          }),
        }
      );
      setShowEdit(false);
      fetchExpenses();
      window.dispatchEvent(new Event("expenseUpdated"));
    } catch (err) {
      console.log(err);
    }
  };

  const totalBudget = budgets
    .filter((b) => b.category !== "TOTAL")
    .reduce((sum, b) => sum + (b.monthly_limit || 0), 0);

  const remaining = totalBudget - total;
  const dailyAvg = total / 30;

  const getColor = (cat) => {
    if (cat.includes("Food")) return "#16a34a";
    if (cat.includes("Transport")) return "#3b82f6";
    if (cat.includes("Shopping")) return "#f59e0b";
    if (cat.includes("Health")) return "#ef4444";
    if (cat.includes("Entertainment")) return "#22c55e";
    return "#6b7280";
  };

  const getBudgetColor = (spent, limit) => {
    const percent = spent / limit;
    if (percent >= 1) return "#ef4444";
    if (percent > 0.7) return "#f59e0b";
    return "#16a34a";
  };

  const weeklyData = [
    { name: "W1", value: total * 0.2 },
    { name: "W2", value: total * 0.35 },
    { name: "W3", value: total * 0.25 },
    { name: "W4", value: total * 0.2 },
  ];

  if (!user) return <Login setUser={setUser} />;

  return (
    <div className="app">
      {sessionExpired && (
        <div className="session-overlay">
          <div className="session-modal">
            <h2>⏳ Session Expired</h2>
            <p>Your session expired. Sign in to continue.</p>
            <button onClick={() => { logout(); window.location.reload(); }}>
              Sign In Again
            </button>
          </div>
        </div>
      )}

      <div className="sidebar">
        <div className="logo">Paisa<span>Track</span></div>
        <div className={`menu ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}>Dashboard</div>
        <div className="menu">Expenses</div>
        <div className="menu">Budgets</div>
        <div className={`menu ${page === "reports" ? "active" : ""}`} onClick={() => setPage("reports")}>Reports</div>
        <div className="menu">Settings</div>
      </div>

      <div className="main">
        {page === "reports" ? (
          <Reports user={user} />
        ) : (
          <>
            <div className="topbar">
              <h1>Dashboard</h1>
              <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                <button onClick={() => { logout(); window.location.reload(); }}
                  style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>
                  Logout
                </button>
                <button className="add-btn">+ Add expense</button>
              </div>
            </div>

            <div className="stats">
              <div className="card"><div>Total spent</div><h2 style={{ color: "#dc2626" }}>₹{total}</h2></div>
              <div className="card"><div>Remaining</div><h2 style={{ color: remaining < 0 ? "#dc2626" : "#16a34a" }}>₹{remaining}</h2></div>
              <div className="card"><div>Daily average</div><h2>₹{dailyAvg.toFixed(0)}</h2></div>
              <div className="card"><div>Transactions</div><h2>{expenses.length}</h2></div>
            </div>

            <div className="quick-form">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What did you spend on?" />
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="₹ Amount" />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Food & Drinks</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Health</option>
                <option>Entertainment</option>
                <option>Others</option>
              </select>
              <button onClick={addExpense}>Add</button>
            </div>

            <div className="quick-form" style={{ marginTop: "10px" }}>
              <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="Set monthly budget ₹" />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Food & Drinks</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Health</option>
                <option>Entertainment</option>
                <option>Others</option>
              </select>
              <button onClick={addBudget}>Set Budget</button>
            </div>

            <div className="grid">
              <div>
                <div className="card">
                  <div className="card-title">Spending by category</div>
                  {["Food & Drinks","Transport","Shopping","Health","Entertainment","Others"].map((cat) => {
                    const amt = byCategory[cat] || 0;
                    if (amt === 0) return null;
                    const budget = budgets.find(b => b.category === cat)?.monthly_limit || 0;
                    const percent = budget ? Math.min((amt / budget) * 100, 100) : 0;
                    return (
                      <div key={cat} className="bar-row">
                        <div className="bar-label">
                          <span className="dot" style={{ background: getColor(cat) }}></span>{cat}
                        </div>
                        <div className="bar">
                          <div className="fill" style={{ width: `${percent}%`, background: getColor(cat) }}></div>
                        </div>
                        <div>₹{amt}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="card">
                  <div className="card-title">Weekly spending trend</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="card">
                  <div className="card-title">Budget tracker</div>
                  {["Food & Drinks","Transport","Shopping","Health","Entertainment","Others"].map((cat) => {
                    const b = budgets.find((b) => b.category === cat);
                    if (!b) return null;
                    const spent = byCategory[cat] || 0;
                    const percent = Math.min((spent / b.monthly_limit) * 100, 100);
                    return (
                      <div key={cat} className="bar-row">
                        <div>{cat}</div>
                        <div className="bar">
                          <div className="fill" style={{ width: `${percent}%`, background: getBudgetColor(spent, b.monthly_limit) }}></div>
                        </div>
                        <div>₹{spent} / ₹{b.monthly_limit}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="card">
                  <div className="card-title">Recent transactions</div>
                  {[...expenses].reverse().slice(0, 6).map((e) => (
                    <div key={e.expense_id} className="recent-row">
                      <span className="dot" style={{ background: getColor(e.category) }}></span>
                      <div className="recent-text">
                        <div>{e.description}</div>
                        <small>{e.category}</small>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "140px", justifyContent: "flex-end" }}>
                        <span>₹{e.amount}</span>
                        <button onClick={() => handleEdit(e)} style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "3px 6px", borderRadius: "5px", fontSize: "11px", cursor: "pointer" }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(e.expense_id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "3px 8px", borderRadius: "5px", fontSize: "11px", cursor: "pointer", minWidth: "60px" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Edit form - UI ke andar */}
                  {showEdit && editData && (
                    <div className="card" style={{ marginTop: "10px" }}>
                      <h3>Edit Expense</h3>
                      <input
                        type="number"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
                      />
                      <button onClick={handleSave}
                        style={{ background: "#16a34a", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer" }}>
                        Save
                      </button>
                      <button onClick={() => setShowEdit(false)}
                        style={{ marginLeft: "10px", padding: "8px 16px", borderRadius: "5px", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}