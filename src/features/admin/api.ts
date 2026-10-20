import type {
  User,
  Department,
  CreateUserInput,
  UpdateUserInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "./types";

const getEnv = (key: string): string => {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && typeof metaEnv[key] === "string") {
      return metaEnv[key];
    }
  } catch {}

  try {
    if (typeof process !== "undefined" && process.env) {
      if (typeof (process.env as any)[key] === "string") {
        return (process.env as any)[key];
      }
    }
  } catch {}

  if (typeof window !== "undefined") {
    const win = window as any;
    if (win.__ENV__ && typeof win.__ENV__[key] === "string") {
      return win.__ENV__[key];
    }
    if (win[key]) {
      return String(win[key]);
    }
  }

  return "";
};

export const isMockEnabled = (): boolean => {
  const envVal = getEnv("VITE_USE_MOCK");
  if (envVal === "true") return true;
  if (envVal === "false") return false;

  if (typeof window !== "undefined" && window.localStorage) {
    const lsVal = window.localStorage.getItem("VITE_USE_MOCK");
    if (lsVal === "true") return true;
    if (lsVal === "false") return false;
  }

  // Default to mock mode in development when backend URL is missing or not explicitly set to false
  return true;
};

export const setMockEnabled = (enabled: boolean): void => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("VITE_USE_MOCK", enabled ? "true" : "false");
  }
};

// Initial mock data used only when VITE_USE_MOCK is "true"
const INITIAL_DEPARTMENTS: Department[] = [
  { id: 1, name: "Computer Science & Engineering", hod_id: 3 },
  { id: 2, name: "Electronics & Telecommunication", hod_id: 4 },
  { id: 3, name: "Mechanical Engineering", hod_id: 5 },
  { id: 4, name: "Information Technology", hod_id: 6 },
];

const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    email: "aarav.student@college.edu",
    role: "student",
    department_id: 1,
    is_active: true,
  },
  {
    id: 2,
    name: "Ananya Deshmukh",
    email: "ananya.sec@college.edu",
    role: "student",
    department_id: 1,
    is_active: true,
  },
  {
    id: 3,
    name: "Dr. Ramesh Kulkarni",
    email: "ramesh.cse@college.edu",
    role: "hod",
    department_id: 1,
    is_active: true,
  },
  {
    id: 4,
    name: "Dr. Priya Patil",
    email: "priya.entc@college.edu",
    role: "hod",
    department_id: 2,
    is_active: true,
  },
  {
    id: 5,
    name: "Dr. Suresh Joshi",
    email: "suresh.mech@college.edu",
    role: "hod",
    department_id: 3,
    is_active: true,
  },
  {
    id: 6,
    name: "Dr. Sunita Rao",
    email: "sunita.it@college.edu",
    role: "hod",
    department_id: 4,
    is_active: true,
  },
  {
    id: 7,
    name: "Prof. Vikas Gupta",
    email: "vikas.faculty@college.edu",
    role: "faculty",
    department_id: 1,
    is_active: true,
  },
  {
    id: 8,
    name: "Prof. Neha Shinde",
    email: "neha.faculty@college.edu",
    role: "faculty",
    department_id: 2,
    is_active: true,
  },
  {
    id: 9,
    name: "System Superadmin",
    email: "admin@college.edu",
    role: "superadmin",
    department_id: null,
    is_active: true,
  },
  {
    id: 10,
    name: "Rohan Verma",
    email: "rohan.alumni@college.edu",
    role: "student",
    department_id: 3,
    is_active: false,
  },
];

const STORAGE_KEY_USERS = "sds_mock_admin_users";
const STORAGE_KEY_DEPTS = "sds_mock_admin_departments";

function getMockUsers(): User[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [...INITIAL_USERS];
  }
  const stored = window.localStorage.getItem(STORAGE_KEY_USERS);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
    return [...INITIAL_USERS];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [...INITIAL_USERS];
  }
}

function saveMockUsers(users: User[]): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }
}

function getMockDepartments(): Department[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [...INITIAL_DEPARTMENTS];
  }
  const stored = window.localStorage.getItem(STORAGE_KEY_DEPTS);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEY_DEPTS, JSON.stringify(INITIAL_DEPARTMENTS));
    return [...INITIAL_DEPARTMENTS];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [...INITIAL_DEPARTMENTS];
  }
}

function saveMockDepartments(departments: Department[]): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY_DEPTS, JSON.stringify(departments));
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getEnv("VITE_API_URL").replace(/\/+$/, "");
  const url = `${base}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch (error: any) {
    throw new Error(error?.message || "Network error. Failed to connect to server.");
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `Server error (${response.status} ${response.statusText})`;
    if (isJson) {
      try {
        const data = await response.json();
        if (data && (data.error || data.message)) {
          errorMessage = data.error || data.message;
        }
      } catch {}
    } else {
      const text = await response.text().catch(() => "");
      if (text && !text.includes("<!doctype html>") && !text.includes("<html")) {
        errorMessage = text.slice(0, 200);
      } else {
        errorMessage = `API endpoint returned HTML (${response.status}). The requested route "${path}" was not found on ${url}.`;
      }
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text().catch(() => "");
    if (text.includes("<!doctype html>") || text.includes("<html")) {
      throw new Error(
        `Received HTML instead of JSON from "${url}". The API server is not running or is serving the single-page application fallback. Enable mock mode (VITE_USE_MOCK=true) or configure a valid VITE_API_URL.`
      );
    }
    throw new Error(`Expected JSON response, but received "${contentType || "unknown"}".`);
  }

  return response.json();
}

export async function fetchUsers(): Promise<User[]> {
  if (isMockEnabled()) {
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getMockUsers();
  }
  return request<User[]>("/admin/users");
}

export async function fetchDepartments(): Promise<Department[]> {
  if (isMockEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getMockDepartments();
  }
  return request<Department[]>("/admin/departments");
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  if (isMockEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const depts = getMockDepartments();
    const nameExists = depts.some(
      (d) => d.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (nameExists) {
      throw new Error(`Department with name "${input.name.trim()}" already exists.`);
    }

    const nextId = depts.length > 0 ? Math.max(...depts.map((d) => d.id)) + 1 : 1;
    const newDept: Department = {
      id: nextId,
      name: input.name.trim(),
      hod_id: input.hod_id,
    };
    depts.unshift(newDept);
    saveMockDepartments(depts);
    return newDept;
  }

  return request<Department>("/admin/departments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateDepartment(
  id: number,
  input: UpdateDepartmentInput
): Promise<Department> {
  if (isMockEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const depts = getMockDepartments();
    const index = depts.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Department with ID ${id} not found.`);
    }
    const existing = depts[index];
    if (!existing) {
      throw new Error(`Department with ID ${id} not found.`);
    }

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      const nameConflict = depts.some(
        (d) => d.id !== id && d.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (nameConflict) {
        throw new Error(`Department with name "${trimmed}" already exists.`);
      }
    }

    const updatedDept: Department = {
      id: existing.id,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      hod_id: input.hod_id !== undefined ? input.hod_id : existing.hod_id,
    };
    depts[index] = updatedDept;
    saveMockDepartments(depts);
    return updatedDept;
  }

  return request<Department>(`/admin/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createUser(input: CreateUserInput): Promise<User> {
  if (isMockEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const users = getMockUsers();
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === input.email.trim().toLowerCase()
    );
    if (emailExists) {
      throw new Error(`User with email "${input.email}" already exists.`);
    }

    const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id: nextId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      department_id: input.department_id,
      is_active: true,
    };
    users.unshift(newUser);
    saveMockUsers(users);
    return newUser;
  }

  return request<User>("/admin/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<User> {
  if (isMockEnabled()) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const users = getMockUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`User with ID ${id} not found.`);
    }
    const existing = users[index];
    if (!existing) {
      throw new Error(`User with ID ${id} not found.`);
    }

    if (input.email) {
      const emailConflict = users.some(
        (u) => u.id !== id && u.email.toLowerCase() === input.email!.trim().toLowerCase()
      );
      if (emailConflict) {
        throw new Error(`Email "${input.email}" is already used by another user.`);
      }
    }

    const updatedUser: User = {
      id: existing.id,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      email: input.email !== undefined ? input.email.trim().toLowerCase() : existing.email,
      role: input.role !== undefined ? input.role : existing.role,
      department_id:
        input.department_id !== undefined ? input.department_id : existing.department_id,
      is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
    };
    users[index] = updatedUser;
    saveMockUsers(users);
    return updatedUser;
  }

  return request<User>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function toggleUserStatus(id: number, isActive: boolean): Promise<User> {
  return updateUser(id, { is_active: isActive });
}
