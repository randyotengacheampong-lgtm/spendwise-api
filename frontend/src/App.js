import { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const API = "https://spendwise-api-q6b6.onrender.com";

const styles = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { margin: 0; background: #f1f5f9; }
.nav { background: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.nav h1 { margin: 0; font-size: 24px; }
.container { max-width: 1000px; margin: 24px auto; padding: 0 20px; }
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.card { color: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.card small { opacity: 0.9; font-size: 14px; }
.card h2 { margin: 8px 0 0; font-size: 26px; }
.green { background: #22c55e; }.red { background: #ef4444; }.blue { background: #2563eb; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.panel { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.panel h3 { margin-top: 0; }
.input-group { display: flex; gap: 8px; flex-wrap: wrap; }
.input-group input,.input-group select { padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; }
.input-group input { flex: 1; min-width: 120px; }
.btn { border: none; padding: 12px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-black { background: #0f172a; color: white; }
.btn-green { background: #16a34a; color: white; }
.btn-blue { background: #2563eb; color: white; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; margin-bottom: 8px; font-size: 14px; gap: 8px; }
.list-expense { background: #fef2f2; }
.list-income { background: #f0fdf4; color: #15803d; }
.delete { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.edit { background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; margin-right: 6px; }
.login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f1f5f9; }
.login-box { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 380px; }
.login-box input { width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
.login-box button { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.link { background: none; border: none; color: #2563eb; cursor: pointer; width: 100%; margin-top: 12px; text-align: center; font-size: 14px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.toolbar input,.toolbar select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
.budget-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }
.budget-box { background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; }
.budget-box label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px; }
.budget-box input { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; }
.over { color: #ef4444; font-weight: 700; font-size: 13px; margin-top: 6px; }
.ok { color: #16a34a; font-size: 13px; margin-top: 6px; }
  @media (max-width: 800px) {.cards { grid-template-columns: 1fr; }.form-row,.grid-2,.budget-grid { grid-template-columns: 1fr; } }
`;

const EXPENSE_CATEGORIES = ["Food", "Transport", "Data", "Mo", "Other"];
const INCOME_CATEGORIES = ["Salary", "Business", "Gift", "Other"];
const PAYMENT_METHODS = ["MTN MoMo", "Vodafone Cash", "AirtelTigo", "Cash", "Card"];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [paymentMethod, setPaymentMethod] = useState("MTN MoMo");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("Salary");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [budgets, setBudgets] = useState({ Food: 5000, Transport: 2000, Data: 5000, MoMo: 2000, Other: 5000 });

  const headers = { Authorization: `Bearer ${token}` };

  const login = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    const res = await axios.post(`${API}/login`, form);
    localStorage.setItem("token", res.data.access_token);
    setToken(res.data.access_token);
  };

  const signup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/register`, { username, password });
      alert("Account created! Now login.");
      setIsSignup(false);
    } catch (err) {
      alert("Signup failed: " + JSON.stringify(err.response?.data));
    }
  };

  const logout = () => { localStorage.removeItem("token"); setToken(""); };

  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/analytics/summary`, { headers });
      setSummary(s.data);
      const me = await axios.get(`${API}/users/me`, { headers });
      setUser(me.data);
      const exp = await axios.get(`${API}/expenses/`, { headers });
      setExpenses(exp.data);
      try {
        const inc = await axios.get(`${API}/incomes/`, { headers });
        setIncomes(inc.data);
      } catch { setIncomes([]); }
    } catch { alert("Login failed"); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const addExpense = async () => {
    if (!amount) return;
    await axios.post(`${API}/expenses/`, { amount: parseFloat(amount), category, title: category, description: paymentMethod, payment_method: paymentMethod }, { headers });
    setAmount(""); fetchData();
  };

  const addIncome = async () => {
    if (!incomeAmount) return;
    await axios.post(`${API}/incomes/`, { amount: parseFloat(incomeAmount), category: incomeCategory, title: incomeCategory, description: "Income" }, { headers });
    setIncomeAmount(""); fetchData();
  };

  const deleteExpense = async (id) => { await axios.delete(`${API}/expenses/${id}/`, { headers }); fetchData(); };
  const deleteIncome = async (id) => { await axios.delete(`${API}/incomes/${id}/`, { headers }); fetchData(); };

  const editExpense = async (exp) => {
    const newAmount = prompt("New amount:", exp.amount);
    if (!newAmount) return;
    const newCat = prompt("New category (Food, Transport, Data, MoMo, Other):", exp.category);
    if (!newCat) return;
    try {
      await axios.put(`${API}/expenses/${exp.id}/`, { amount: parseFloat(newAmount), category: newCat, title: newCat, description: paymentMethod }, { headers });
      fetchData();
    } catch (err) {
      alert("Edit failed: " + JSON.stringify(err.response?.data));
    }
  };

  const editIncome = async (inc) => {
    const newAmount = prompt("New amount:", inc.amount);
    if (!newAmount) return;
    try {
      await axios.put(`${API}/incomes/${inc.id}/`, { amount: parseFloat(newAmount), category: inc.category || incomeCategory, title: inc.category || incomeCategory, description: "Income" }, { headers });
      fetchData();
    } catch (err) {
      alert("Edit failed: " + JSON.stringify(err.response?.data));
    }
  };

  const exportCSV = () => {
    let csv = "Type,Category,Amount,PaymentMethod\n";
    expenses.forEach(e => csv += `Expense,${e.category},${e.amount},${e.description || ""}\n`);
    incomes.forEach(i => csv += `Income,${i.category || i.title},${i.amount},\n`);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spendwise.csv";
    a.click();
  };

  if (!token) return (
    <div className="login-wrap">
      <style>{styles}</style>
      <form onSubmit={isSignup? signup : login} className="login-box">
        <h1 style={{ textAlign: "center", marginTop: 0 }}>SpendWise 🇬🇭</h1>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 14, marginTop: -10 }}>Ghana Fintech: Track Income and Expense in GHS ₵ with MoMo</p>
        <input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">{isSignup? "Create Account" : "Login"}</button>
        <button type="button" className="link" onClick={() => setIsSignup(!isSignup)}>
          {isSignup? "Already have an account? Login" : "No account? Create Account"}
        </button>
      </form>
    </div>
  );

  const chartData = expenses.reduce((acc, cur) => {
    const f = acc.find(x => x.name === cur.category);
    if (f) f.value += cur.amount; else acc.push({ name: cur.category, value: cur.amount });
    return acc;
  }, []);
  const COLORS = ["#f97316", "#22c55e", "#0ea5e9", "#ef4444", "#a855f7", "#eab308"];

  const filteredExpenses = expenses.filter(e =>
    (filterCategory === "All" || e.category === filterCategory) &&
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalsByCat = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return (
    <div>
      <style>{styles}</style>
      <div className="nav">
        <h1>SpendWise 🇬🇭</h1>
        <div>
          <span style={{ marginRight: 12 }}>Hi, {user?.username}</span>
          <button onClick={exportCSV} className="btn btn-blue" style={{ padding: "8px 14px", marginRight: 8 }}>Export CSV</button>
          <button onClick={logout} className="btn btn-black" style={{ padding: "8px 14px" }}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div className="cards">
          <div className="card green"><small>Total Income</small><h2>GHS ₵ {summary.total_income}</h2></div>
          <div className="card red"><small>Total Expense</small><h2>GHS ₵ {summary.total_expense}</h2></div>
          <div className="card blue"><small>Balance</small><h2>GHS ₵ {summary.balance}</h2></div>
        </div>

        <div className="form-row">
          <div className="panel">
            <h3>Add Expense</h3>
            <div className="input-group">
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
              <button onClick={addExpense} className="btn btn-black">Add</button>
            </div>
          </div>
          <div className="panel">
            <h3>Add Income</h3>
            <div className="input-group">
              <input type="number" placeholder="Amount" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
              <select value={incomeCategory} onChange={e => setIncomeCategory(e.target.value)}>
                {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={addIncome} className="btn btn-green">Add</button>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginBottom: 20 }}>
          <h3>Monthly Budget</h3>
          <div className="budget-grid">
            {Object.keys(budgets).map(cat => (
              <div key={cat} className="budget-box">
                <label>{cat} Budget</label>
                <input type="number" value={budgets[cat]} onChange={e => setBudgets({...budgets, [cat]: parseFloat(e.target.value) || 0 })} />
                <div className="text-sm" style={{ marginTop: 6 }}>Spent: GHS ₵ {totalsByCat[cat] || 0}</div>
                {(totalsByCat[cat] || 0) > budgets[cat]? <div className="over">Over budget by GHS ₵ {(totalsByCat[cat] || 0) - budgets[cat]}</div> : <div className="ok">Within budget</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="toolbar">
          <input placeholder="Search category..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option>All</option>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid-2">
          <div className="panel">
            <h3>Where your money goes</h3>
            {chartData.length === 0? <p>No expenses yet</p> : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                    {chartData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="panel">
            <h3>Expenses ({filteredExpenses.length})</h3>
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="list-item list-expense">
                <span>{exp.category} - GHS ₵ {exp.amount} {exp.description? `(${exp.description})` : ""}</span>
                <span>
                  <button onClick={() => editExpense(exp)} className="edit">Edit</button>
                  <button onClick={() => deleteExpense(exp.id)} className="delete">Delete</button>
                </span>
              </div>
            ))}
            <h3 style={{ marginTop: 20 }}>Income</h3>
            {incomes.map(inc => {
              const label = inc.category || inc.source || inc.title || inc.name || "Income";
              return (
                <div key={inc.id} className="list-item list-income">
                  <span>{label} - GHS ₵ {inc.amount}</span>
                  <span>
                    <button onClick={() => editIncome(inc)} className="edit">Edit</button>
                    <button onClick={() => deleteIncome(inc.id)} className="delete">Delete</button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}