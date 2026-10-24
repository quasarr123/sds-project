
import { useState } from "react";

export default function Login({ onLogin }) {
  const [role, setRole] = useState("Student");
  const [branch, setBranch] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    setMessage("Login form submitted. Backend authentication is not connected yet.");
    onLogin(role);

    if (role === "HOD" && !branch) {
      setMessage("Please select your branch.");
      return;
    }

    const identifier =
      role === "Superadmin"
        ? true
        : role === "HOD"
          ? true
          : role === "Faculty"
            ? username.trim()
            : username.trim();

    if (!identifier || !password) {
      setMessage("Please fill in all required fields.");
      return;
    }

    // Frontend demo only. Real authentication will use the backend.
    setMessage("Login form submitted. Backend authentication is not connected yet.");
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginTop: "6px",
    marginBottom: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "15px",
  };

  const labelStyle = {
    display: "block",
    fontWeight: "600",
    fontSize: "14px",
    color: "#374151",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f3f4f6",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#ffffff",
          padding: "32px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            margin: "0 0 8px",
            color: "#111827",
            fontSize: "27px",
          }}
        >
          Venue Booking
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "28px",
          }}
        >
          Sign in to your account
        </p>

        <form onSubmit={handleLogin}>
          <label style={labelStyle} htmlFor="role">
            Login as
          </label>

          <select
            id="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setBranch("");
              setUsername("");
              setPassword("");
              setMessage("");
            }}
            style={inputStyle}
          >
            <option value="Superadmin">Superadmin</option>
            <option value="HOD">HOD</option>
            <option value="Faculty">Faculty</option>
            <option value="Student">Student</option>
          </select>

          {role === "HOD" && (
            <>
              <label style={labelStyle} htmlFor="branch">
                Branch
              </label>

              <select
                id="branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select branch</option>
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="ENTC">Electronics and Telecommunication</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </>
          )}

          {role === "Faculty" && (
            <>
              <label style={labelStyle} htmlFor="username">
                Username
              </label>

              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            </>
          )}

          {role === "Student" && (
            <>
              <label style={labelStyle} htmlFor="mis">
                MIS Number
              </label>

              <input
                id="mis"
                type="text"
                placeholder="Enter your MIS number"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={inputStyle}
              />
            </>
          )}

          <label style={labelStyle} htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {message && (
            <p
              role="status"
              style={{
                color: "#b91c1c",
                fontSize: "13px",
                marginTop: "0",
                marginBottom: "16px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "12px",
            marginTop: "22px",
            marginBottom: "0",
          }}
        >
          Venue Booking System
        </p>
      </div>
    </div>
  );
}
