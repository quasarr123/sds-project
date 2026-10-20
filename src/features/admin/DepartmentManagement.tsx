import { useEffect, useState, useMemo, type FormEvent } from "react";
import type { Department, User, CreateDepartmentInput, UpdateDepartmentInput } from "./types";
import {
  fetchDepartments,
  fetchUsers,
  createDepartment,
  updateDepartment,
} from "./api";

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hodFilter, setHodFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form fields
  const [formName, setFormName] = useState<string>("");
  const [formHodId, setFormHodId] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptsData, usersData] = await Promise.all([
        fetchDepartments(),
        fetchUsers().catch(() => [] as User[]),
      ]);
      setDepartments(deptsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err?.message || "Failed to load departments from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter only users whose role is "hod"
  const hodUsers = useMemo(() => {
    return users.filter((u) => u.role === "hod");
  }, [users]);

  // Fast user lookup map by ID
  const userMap = useMemo(() => {
    const map = new Map<number, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const openAddModal = () => {
    setEditingDept(null);
    setFormName("");
    setFormHodId("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormHodId(dept.hod_id !== null ? String(dept.hod_id) : "");
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
      setEditingDept(null);
      setModalError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setModalError("Department name is required.");
      return;
    }

    const hodId = formHodId ? Number(formHodId) : null;

    setSubmitting(true);
    try {
      if (editingDept) {
        const updatePayload: UpdateDepartmentInput = {
          name: trimmedName,
          hod_id: hodId,
        };
        const updated = await updateDepartment(editingDept.id, updatePayload);
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d))
        );
      } else {
        const createPayload: CreateDepartmentInput = {
          name: trimmedName,
          hod_id: hodId,
        };
        const created = await createDepartment(createPayload);
        setDepartments((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const hod = d.hod_id ? userMap.get(d.hod_id) : null;
        const matchesHod = hod
          ? hod.name.toLowerCase().includes(q) || hod.email.toLowerCase().includes(q)
          : false;
        if (!matchesName && !matchesHod) return false;
      }

      if (hodFilter === "assigned" && d.hod_id === null) {
        return false;
      }
      if (hodFilter === "unassigned" && d.hod_id !== null) {
        return false;
      }

      return true;
    });
  }, [departments, searchQuery, hodFilter, userMap]);

  return (
    <div className="admin-departments-view">
      {/* Top Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-filters">
          <input
            type="text"
            className="admin-input"
            placeholder="Search by department or HOD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="admin-select"
            value={hodFilter}
            onChange={(e) => setHodFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="assigned">With HOD Assigned</option>
            <option value="unassigned">Unassigned HOD</option>
          </select>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          + Add Department
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="admin-error-banner">
          <div>
            <strong>Error: </strong>
            <span>{error}</span>
          </div>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="admin-state-box">
          <div className="admin-loading-spinner" />
          <h3 className="admin-state-title">Loading Departments</h3>
          <p className="admin-state-desc">Fetching departments from the server...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        /* Empty State */
        <div className="admin-state-box">
          <h3 className="admin-state-title">No Departments Found</h3>
          <p className="admin-state-desc">
            {departments.length === 0
              ? "The department database currently has no records."
              : "No departments matched your search and filter criteria."}
          </p>
          {departments.length > 0 ? (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setSearchQuery("");
                setHodFilter("all");
              }}
            >
              Reset Filters
            </button>
          ) : (
            <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
              Create First Department
            </button>
          )}
        </div>
      ) : (
        /* Data Table */
        <div className="admin-table-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "80px" }}>ID</th>
                  <th>Department Name</th>
                  <th>Head of Department (HOD)</th>
                  <th style={{ textAlign: "right", width: "120px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => {
                  const hod = dept.hod_id ? userMap.get(dept.hod_id) : null;

                  return (
                    <tr key={dept.id}>
                      <td style={{ color: "#9ca3af" }}>#{dept.id}</td>
                      <td>
                        <span className="admin-user-name">{dept.name}</span>
                      </td>
                      <td>
                        {hod ? (
                          <div className="admin-user-cell">
                            <span className="admin-user-name">{hod.name}</span>
                            <span className="admin-user-email">{hod.email}</span>
                          </div>
                        ) : (
                          <span className="admin-badge admin-badge-inactive">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="admin-actions-cell"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => openEditModal(dept)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingDept
                  ? `Edit Department #${editingDept.id}`
                  : "Create New Department"}
              </h3>
              <button
                className="admin-modal-close"
                onClick={closeModal}
                disabled={submitting}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {modalError && (
                  <div className="admin-error-banner" style={{ margin: "0 0 1rem 0" }}>
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="admin-form-group">
                  <label className="admin-form-label">Department Name *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Computer Science & Engineering"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={submitting}
                    autoFocus
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Head of Department (HOD)</label>
                  <select
                    className="admin-form-select"
                    value={formHodId}
                    onChange={(e) => setFormHodId(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">-- No HOD / Unassigned --</option>
                    {hodUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {hodUsers.length === 0 && (
                    <div className="admin-form-error" style={{ color: "#9ca3af" }}>
                      Note: No users with role &quot;hod&quot; currently exist in the system.
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Saving..."
                    : editingDept
                    ? "Save Changes"
                    : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentManagement;
