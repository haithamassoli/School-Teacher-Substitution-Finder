// Data models for School Teacher Substitution Finder

/**
 * Represents a teacher in the system
 */
export interface Teacher {
  id: string;
  name: string;
  createdAt: number;
}

/**
 * Represents a class/grade (e.g., "الصف السادس")
 */
export interface Class {
  id: string;
  name: string;
  createdAt: number;
}

/**
 * Represents a section within a class (e.g., "الصف السادس أ")
 */
export interface Section {
  id: string;
  classId: string;
  name: string; // Full name like "الصف السادس أ"
  sectionLetter: string; // Just the letter like "أ", "ب", "ج"
  createdAt: number;
}

/**
 * Represents a single schedule entry (teacher assignment to a period)
 * Note: We have 7 periods per day for each section
 */
export interface ScheduleEntry {
  id: string;
  sectionId: string;
  period: number; // 1-7
  teacherId: string;
  createdAt: number;
}

/**
 * Helper type for displaying section with class info
 */
export interface SectionWithClass extends Section {
  className: string;
}

/**
 * Helper type for displaying schedule with full details
 */
export interface ScheduleEntryWithDetails extends ScheduleEntry {
  teacherName: string;
  sectionName: string;
  className: string;
}

/**
 * Type for available teacher in substitution finder
 */
export interface AvailableTeacher {
  id: string;
  name: string;
}

/**
 * Period information
 */
export interface PeriodInfo {
  number: number;
  label: string; // e.g., "الحصة 1"
}

/**
 * Constants
 */
export const PERIODS_PER_DAY = 7;
export const SECTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز"] as const;

/**
 * Helper function to generate period labels in Arabic
 */
export const getPeriodLabel = (period: number): string => {
  return `الحصة ${period}`;
};

/**
 * Helper function to get all periods
 */
export const getAllPeriods = (): PeriodInfo[] => {
  return Array.from({ length: PERIODS_PER_DAY }, (_, i) => ({
    number: i + 1,
    label: getPeriodLabel(i + 1),
  }));
};
