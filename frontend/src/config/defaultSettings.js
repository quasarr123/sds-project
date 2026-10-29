// Fallback shape used until the server returns the real settings from the database.
export const INITIAL_SETTINGS = {
  minLeadTimeDays: 3,
  maxAdvanceDays: 60,
  allowWeekendBooking: true,
  autoEscalateHours: 48,
  dailyClosingTime: '21:30',
  dailyOpeningTime: '07:30',
  autoNotifyEmail: true,
  autoNotifySMS: true,
  requireFacultyEndorsementForStudents: true,
  requireHODApprovalForDeptVenues: true,
  maxConcurrentBookingsPerClub: 2,
  gracePeriodMinutesForCancellation: 24,
  maintenanceWindowHoursWeekly: 8,
  termsAndConditions: 'All student clubs must adhere to COEP sound limits (below 65dB post 8 PM) and vacate venues within 30 minutes of reservation expiration. Alcohol, tobacco, or hazardous pyrotechnics are strictly banned under Maharashtra University Act.',
};

