/**
 * Final booking & approval rules (PDF 1). Pure functions, no database access.
 *
 *  Student  + venue in own department ............ Departmental HOD
 *  Student  + Auditorium / Mini Aud. / Acad. Cx .. Superadmin
 *  Student  + club event or club venue ........... Club Faculty Advisor, then Superadmin
 *  Faculty  + extra class ........................ Auto-approved (after availability check)
 *  Faculty  + any other purpose .................. Relevant HOD
 *  HOD / Superadmin .............................. Cannot request bookings
 */
import { HttpError } from "./http";
import type { SessionUser } from "../plugins/auth";

export type Route = "auto" | "hod" | "superadmin" | "club";
export type BookingStatus =
  | "Pending Faculty" | "Pending HOD" | "Pending Superadmin" | "Approved" | "Rejected" | "Cancelled";

export interface ApprovalPlan {
  route: Route;
  bookingType: "regular" | "club" | "extra_class" | "other";
  status: BookingStatus;
  reviewDepartment: string | null;
  advisorId: number | null;
  clubId: number | null;
  clubName: string | null;
  /** Human-readable text for bookings.approved_by while the request is waiting. */
  waitingText: string;
  endorsement: string;
}

export interface VenueLike { name: string; department: string; category: string | null }
export interface ClubLike { id: number; name: string; faculty_advisor_id: number | null; advisor_name?: string | null }

export const CANNOT_BOOK: Record<string, string> = {
  hod: "HODs cannot request bookings. You can only review requests from your department.",
  superadmin: "Superadmins do not request bookings. You can review, approve or cancel any booking.",
};

export function planBooking(
  user: SessionUser,
  venue: VenueLike,
  input: { clubId?: number | null; bookingType?: string },
  club: ClubLike | null
): ApprovalPlan {
  const category = venue.category ?? "department";

  if (CANNOT_BOOK[user.role]) throw new HttpError(403, CANNOT_BOOK[user.role]!);

  if (user.role === "student") {
    const clubEvent = input.clubId != null || category === "club";
    if (clubEvent) {
      if (!club) {
        throw new HttpError(400, category === "club" && input.clubId == null
          ? "This is a club venue. Please choose the club you are booking it for."
          : "Selected club does not exist.");
      }
      if (club.faculty_advisor_id == null) {
        throw new HttpError(400, `${club.name} has no faculty advisor assigned yet. Please contact the administrator.`);
      }
      return {
        route: "club", bookingType: "club", status: "Pending Faculty",
        reviewDepartment: null, advisorId: club.faculty_advisor_id, clubId: club.id, clubName: club.name,
        waitingText: `Awaiting Club Faculty Advisor${club.advisor_name ? `: ${club.advisor_name}` : ""}, then Superadmin`,
        endorsement: "Awaiting club faculty advisor approval",
      };
    }
    if (category === "central") {
      return {
        route: "superadmin", bookingType: "regular", status: "Pending Superadmin",
        reviewDepartment: null, advisorId: null, clubId: null, clubName: null,
        waitingText: "Awaiting Superadmin approval",
        endorsement: "Central venue: Superadmin approval required",
      };
    }
    // Department venue
    if (venue.department !== user.department) {
      throw new HttpError(400,
        `${venue.name} belongs to ${venue.department}. Students can book venues of their own department (${user.department}), ` +
        "central venues (auditorium / academic complex) or, for a club event, club venues.");
    }
    return {
      route: "hod", bookingType: "regular", status: "Pending HOD",
      reviewDepartment: venue.department, advisorId: null, clubId: null, clubName: null,
      waitingText: `Awaiting HOD of ${venue.department}`,
      endorsement: "Departmental venue: HOD approval required",
    };
  }

  // Faculty
  if (input.bookingType === "extra_class") {
    return {
      route: "auto", bookingType: "extra_class", status: "Approved",
      reviewDepartment: null, advisorId: null, clubId: null, clubName: null,
      waitingText: "Auto-approved (faculty extra class)",
      endorsement: "Extra class: auto-approved after availability check",
    };
  }
  const reviewDepartment = category === "department" ? venue.department : user.department;
  return {
    route: "hod", bookingType: "other", status: "Pending HOD",
    reviewDepartment, advisorId: null, clubId: null, clubName: null,
    waitingText: `Awaiting HOD of ${reviewDepartment}`,
    endorsement: "Faculty request: HOD approval required",
  };
}

export type Step = "advisor" | "hod" | "superadmin";

/** Which approval step is a booking in right now? */
export function currentStep(status: string): Step | null {
  if (status === "Pending Faculty") return "advisor";
  if (status === "Pending HOD") return "hod";
  if (status === "Pending Superadmin") return "superadmin";
  return null;
}

/** Status after the current step is approved. */
export function nextStatus(route: string, status: string): BookingStatus {
  if (route === "club" && status === "Pending Faculty") return "Pending Superadmin";
  return "Approved";
}

/**
 * May this user act (approve or reject) on a booking that is waiting at its current step?
 * Returns an error message, or null when allowed.
 */
export function whyCannotReview(
  user: SessionUser,
  b: { status: string; advisor_id: number | null; review_department: string | null; department: string | null },
  venueDepartment: string | null,
  action: "approve" | "reject"
): string | null {
  const step = currentStep(b.status);
  if (!step) return `This booking is already "${b.status}" and can no longer be changed.`;

  if (user.role === "superadmin") {
    // Superadmin may override a pending HOD step, but cannot skip the club advisor on approve.
    if (step === "advisor" && action === "approve") {
      return "A club booking needs the Club Faculty Advisor's approval first. Superadmin can approve after the advisor.";
    }
    return null;
  }
  if (user.role === "faculty") {
    if (step === "advisor" && b.advisor_id === user.id) return null;
    return "Only the club's Faculty Advisor can review this request.";
  }
  if (user.role === "hod") {
    if (step !== "hod") return "HODs can only review requests that are waiting for HOD approval.";
    const dept = b.review_department ?? b.department ?? venueDepartment;
    if (dept !== user.department) return "This request belongs to a different department.";
    return null;
  }
  return "Forbidden: insufficient permissions";
}
