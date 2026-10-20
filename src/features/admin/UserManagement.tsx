import { useEffect, useState, useMemo, type FormEvent } from "react";
import type { User, Department, UserRole, CreateUserInput, UpdateUserInput } from "./types";
import {
  fetchUsers,
  fetchDepartments,
  createUser,
  updateUser,
  toggleUserStatus,
} from "./api";

const ROLES: UserRole[] = ["student", "faculty", "hod", "superadmin"];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form fields
  const [formName, setFormName] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formRole, setFormRole] = useState<UserRole>("student");
  const [formDeptId, setFormDeptId] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, deptsData] = await Promise.all([
        fetchUsers(),
        fetchDepartments().catch(() => [] as Department[]),
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (err: any) {
      setError(err?.message || "Failed to load users from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormRole("student");
    setFormDeptId("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormDeptId(user.department_id ? String(user.department_id) : "");
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!submitting) {
      setIsModalOpen(false);
      setEditingUser(null);
      setModalError(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = formName.trim();
    const trimmedEmail = formEmail.trim();

    if (!trimmedName) {
      setModalError("Full name is required.");
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setModalError("A valid email address is required.");
      return;
    }

    const deptId = formDeptId ? Number(formDeptId) : null;

    setSubmitting(true);
    try {
      if (editingUser) {
        const updatePayload: UpdateUserInput = {
          name: trimmedName,
          email: trimmedEmail,
          role: formRole,
          department_id: deptId,
        };
        const updated = await updateUser(editingUser.id, updatePayload);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const createPayload: CreateUserInput = {
          name: trimmedName,
          email: trimmedEmail,
          role: formRole,
          department_id: deptId,
        };
        const created = await createUser(createPayload);
        setUsers((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = !user.is_active;
    try {
      const updated = await toggleUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      setError(err?.message || `Failed to update status for user ${user.name}`);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }
      if (selectedRole !== "all" && u.role !== selectedRole) {
        return false;
      }
      if (selectedDept !== "all") {
        if (selectedDept === "none" && u.department_id !== null) return false;
        if (selectedDept !== "none" && u.department_id !== Number(selectedDept)) return false;
      }
      if (selectedStatus !== "all") {
        const isActiveFilter = selectedStatus === "active";
        if (u.is_active !== isActiveFilter) return false;
      }
      return true;
    });
  }, [users, searchQuery, selectedRole, selectedDept, selectedStatus]);

  const departmentMap = useMemo(() => {
    const map = new Map<number, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  return (
    <div className="admin-users-view">
      {/* Top Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-filters">
          <input
            type="text"
            className="admin-input"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="admin-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="none">Central / No Dept</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          + Add User
        </button>
      </div>

      {/* Global Error State Banner */}
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
          <h3 className="admin-state-title">Loading Users</h3>
          <p className="admin-state-desc">Fetching user directory from the server...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        /* Empty State */
        <div className="admin-state-box">
          <h3 className="admin-state-title">No Users Found</h3>
          <p className="admin-state-desc">
            {users.length === 0
              ? "The user database currently has no records."
              : "No users matched your search and filter criteria."}
          </p>
          {users.length > 0 ? (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setSearchQuery("");
                setSelectedRole("all");
                setSelectedDept("all");
                setSelectedStatus("all");
              }}
            >
              Reset Filters
            </button>
          ) : (
            <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
              Create First User
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
                  <th style={{ width: "60px" }}>ID</th>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right", width: "180px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const deptName = user.department_id
                    ? departmentMap.get(user.department_id) || `Dept #${user.department_id}`
                    : "Central / None";

                  return (
                    <tr key={user.id}>
                      <td style={{ color: "#9ca3af" }}>#{user.id}</td>
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-user-name">{user.name}</span>
                          <span className="admin-user-email">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "#d1d5db" }}>{deptName}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            user.is_active ? "admin-badge-active" : "admin-badge-inactive"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="admin-actions-cell"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </button>
                          <button
                            className={`admin-btn admin-btn-sm ${
                              user.is_active ? "admin-btn-danger" : "admin-btn-success"
                            }`}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
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

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingUser ? `Edit User #${editingUser.id}` : "Create New User"}
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
                  <label className="admin-form-label">Full Name *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Dr. Rajesh Verma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={submitting}
                    autoFocus
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Email Address *</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    placeholder="e.g. rajesh.verma@college.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Role *</label>
                  <select
                    className="admin-form-select"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    disabled={submitting}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Department</label>
                  <select
                    className="admin-form-select"
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">None / Central</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
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
                    : editingUser
                    ? "Save Changes"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
