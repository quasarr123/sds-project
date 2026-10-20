import { useState } from "react";
import { UserManagement } from "./UserManagement";
import { DepartmentManagement } from "./DepartmentManagement";
import { isMockEnabled, setMockEnabled } from "./api";
import "./admin.css";

type AdminTab = "users" | "departments" | "clubs" | "venues" | "alternates";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [isMock, setIsMock] = useState<boolean>(() => isMockEnabled());

  const handleToggleMode = () => {
    const nextState = !isMock;
    setMockEnabled(nextState);
    setIsMock(nextState);
    window.location.reload();
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-title-area">
          <h1>Superadmin Management</h1>
          <p className="admin-subtitle">
            SDS Venue Booking System - Administrative Control Panel
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className={`admin-mode-tag ${isMock ? "mock" : "live"}`}
            onClick={handleToggleMode}
            title="Click to toggle between Mock Data and Live API Mode"
            style={{ cursor: "pointer", border: "1px solid" }}
          >
            {isMock ? "Mock Mode (Active) - Click to switch" : "Live API Mode - Click to switch"}
          </button>
        </div>
      </header>

      {/* Module Navigation Tabs */}
      <nav className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`admin-tab ${activeTab === "departments" ? "active" : ""}`}
          onClick={() => setActiveTab("departments")}
        >
          Departments & HOD
        </button>
        <button
          className={`admin-tab ${activeTab === "clubs" ? "active" : ""}`}
          disabled
          title="Will be implemented in next step"
        >
          Clubs & Advisors
        </button>
        <button
          className={`admin-tab ${activeTab === "venues" ? "active" : ""}`}
          disabled
          title="Will be implemented in next step"
        >
          Venues & Approvers
        </button>
        <button
          className={`admin-tab ${activeTab === "alternates" ? "active" : ""}`}
          disabled
          title="Will be implemented in next step"
        >
          HOD Alternates
        </button>
      </nav>

      {/* Active Tab View */}
      <main className="admin-content">
        {activeTab === "users" && <UserManagement />}
        {activeTab === "departments" && <DepartmentManagement />}
      </main>
    </div>
  );
}

export default AdminPanel;
