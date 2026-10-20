export type UserRole = "student" | "faculty" | "hod" | "superadmin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
  is_active: boolean;
}

export interface Department {
  id: number;
  name: string;
  hod_id: number | null;
}

export interface Club {
  id: number;
  name: string;
  advisor_id: number;
}

export type VenueType = "classroom" | "lab" | "seminar_hall" | "mini_auditorium" | "main_auditorium";
export type VenueOwnerType = "DEPARTMENT" | "COMPLEX";

export interface Venue {
  id: number;
  name: string;
  type: VenueType;
  building: string;
  floor: string;
  capacity: number;
  owner_type: VenueOwnerType;
  department_id: number | null;
  approver_id: number | null;
  is_active: boolean;
}

export interface Alternate {
  user_id: number;
  alternate_id: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: UserRole;
  department_id: number | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  department_id?: number | null;
  is_active?: boolean;
}

export interface CreateDepartmentInput {
  name: string;
  hod_id: number | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  hod_id?: number | null;
}

