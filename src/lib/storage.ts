import type {
  Teacher,
  Class,
  Section,
  ScheduleEntry,
  SectionWithClass,
  ScheduleEntryWithDetails,
  AvailableTeacher,
} from "./types";

// Storage keys
const STORAGE_KEYS = {
  TEACHERS: "school_teachers",
  CLASSES: "school_classes",
  SECTIONS: "school_sections",
  SCHEDULE: "school_schedule",
} as const;

// ============================================================================
// Generic Storage Utilities
// ============================================================================

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// Teacher Operations
// ============================================================================

export const teacherStorage = {
  getAll(): Teacher[] {
    return getFromStorage<Teacher>(STORAGE_KEYS.TEACHERS);
  },

  getById(id: string): Teacher | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  create(name: string): Teacher {
    const teachers = this.getAll();
    const newTeacher: Teacher = {
      id: generateId(),
      name: name.trim(),
      createdAt: Date.now(),
    };
    teachers.push(newTeacher);
    saveToStorage(STORAGE_KEYS.TEACHERS, teachers);
    return newTeacher;
  },

  update(id: string, name: string): Teacher | null {
    const teachers = this.getAll();
    const index = teachers.findIndex((t) => t.id === id);
    if (index === -1) return null;

    teachers[index] = {
      ...teachers[index],
      name: name.trim(),
    };
    saveToStorage(STORAGE_KEYS.TEACHERS, teachers);
    return teachers[index];
  },

  delete(id: string): boolean {
    const teachers = this.getAll();
    const filtered = teachers.filter((t) => t.id !== id);
    if (filtered.length === teachers.length) return false;

    // Also delete all schedule entries for this teacher
    scheduleStorage.deleteByTeacherId(id);

    saveToStorage(STORAGE_KEYS.TEACHERS, filtered);
    return true;
  },
};

// ============================================================================
// Class Operations
// ============================================================================

export const classStorage = {
  getAll(): Class[] {
    return getFromStorage<Class>(STORAGE_KEYS.CLASSES);
  },

  getById(id: string): Class | undefined {
    return this.getAll().find((c) => c.id === id);
  },

  create(name: string): Class {
    const classes = this.getAll();
    const newClass: Class = {
      id: generateId(),
      name: name.trim(),
      createdAt: Date.now(),
    };
    classes.push(newClass);
    saveToStorage(STORAGE_KEYS.CLASSES, classes);
    return newClass;
  },

  update(id: string, name: string): Class | null {
    const classes = this.getAll();
    const index = classes.findIndex((c) => c.id === id);
    if (index === -1) return null;

    classes[index] = {
      ...classes[index],
      name: name.trim(),
    };
    saveToStorage(STORAGE_KEYS.CLASSES, classes);
    return classes[index];
  },

  delete(id: string): boolean {
    const classes = this.getAll();
    const filtered = classes.filter((c) => c.id !== id);
    if (filtered.length === classes.length) return false;

    // Delete all sections of this class
    const sections = sectionStorage.getBySectionClass(id);
    sections.forEach((section) => sectionStorage.delete(section.id));

    saveToStorage(STORAGE_KEYS.CLASSES, filtered);
    return true;
  },
};

// ============================================================================
// Section Operations
// ============================================================================

export const sectionStorage = {
  getAll(): Section[] {
    return getFromStorage<Section>(STORAGE_KEYS.SECTIONS);
  },

  getById(id: string): Section | undefined {
    return this.getAll().find((s) => s.id === id);
  },

  getBySectionClass(classId: string): Section[] {
    return this.getAll().filter((s) => s.classId === classId);
  },

  getAllWithClassInfo(): SectionWithClass[] {
    const sections = this.getAll();
    const classes = classStorage.getAll();

    return sections.map((section) => {
      const classInfo = classes.find((c) => c.id === section.classId);
      return {
        ...section,
        className: classInfo?.name || "غير معروف",
      };
    });
  },

  create(
    classId: string,
    sectionLetter: string,
    fullName: string
  ): Section {
    const sections = this.getAll();
    const newSection: Section = {
      id: generateId(),
      classId,
      name: fullName.trim(),
      sectionLetter: sectionLetter.trim(),
      createdAt: Date.now(),
    };
    sections.push(newSection);
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);
    return newSection;
  },

  update(
    id: string,
    sectionLetter: string,
    fullName: string
  ): Section | null {
    const sections = this.getAll();
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return null;

    sections[index] = {
      ...sections[index],
      name: fullName.trim(),
      sectionLetter: sectionLetter.trim(),
    };
    saveToStorage(STORAGE_KEYS.SECTIONS, sections);
    return sections[index];
  },

  delete(id: string): boolean {
    const sections = this.getAll();
    const filtered = sections.filter((s) => s.id !== id);
    if (filtered.length === sections.length) return false;

    // Delete all schedule entries for this section
    scheduleStorage.deleteBySectionId(id);

    saveToStorage(STORAGE_KEYS.SECTIONS, filtered);
    return true;
  },
};

// ============================================================================
// Schedule Operations
// ============================================================================

export const scheduleStorage = {
  getAll(): ScheduleEntry[] {
    return getFromStorage<ScheduleEntry>(STORAGE_KEYS.SCHEDULE);
  },

  getById(id: string): ScheduleEntry | undefined {
    return this.getAll().find((s) => s.id === id);
  },

  getBySectionId(sectionId: string): ScheduleEntry[] {
    return this.getAll().filter((s) => s.sectionId === sectionId);
  },

  getByPeriod(period: number): ScheduleEntry[] {
    return this.getAll().filter((s) => s.period === period);
  },

  getBySectionAndPeriod(
    sectionId: string,
    period: number
  ): ScheduleEntry | undefined {
    return this.getAll().find(
      (s) => s.sectionId === sectionId && s.period === period
    );
  },

  getAllWithDetails(): ScheduleEntryWithDetails[] {
    const schedule = this.getAll();
    const teachers = teacherStorage.getAll();
    const sections = sectionStorage.getAllWithClassInfo();

    return schedule.map((entry) => {
      const teacher = teachers.find((t) => t.id === entry.teacherId);
      const section = sections.find((s) => s.id === entry.sectionId);

      return {
        ...entry,
        teacherName: teacher?.name || "غير معروف",
        sectionName: section?.name || "غير معروف",
        className: section?.className || "غير معروف",
      };
    });
  },

  create(
    sectionId: string,
    period: number,
    teacherId: string
  ): ScheduleEntry | null {
    // Check if entry already exists
    const existing = this.getBySectionAndPeriod(sectionId, period);
    if (existing) {
      return this.update(existing.id, teacherId);
    }

    const schedule = this.getAll();
    const newEntry: ScheduleEntry = {
      id: generateId(),
      sectionId,
      period,
      teacherId,
      createdAt: Date.now(),
    };
    schedule.push(newEntry);
    saveToStorage(STORAGE_KEYS.SCHEDULE, schedule);
    return newEntry;
  },

  update(id: string, teacherId: string): ScheduleEntry | null {
    const schedule = this.getAll();
    const index = schedule.findIndex((s) => s.id === id);
    if (index === -1) return null;

    schedule[index] = {
      ...schedule[index],
      teacherId,
    };
    saveToStorage(STORAGE_KEYS.SCHEDULE, schedule);
    return schedule[index];
  },

  delete(id: string): boolean {
    const schedule = this.getAll();
    const filtered = schedule.filter((s) => s.id !== id);
    if (filtered.length === schedule.length) return false;

    saveToStorage(STORAGE_KEYS.SCHEDULE, filtered);
    return true;
  },

  deleteBySectionId(sectionId: string): void {
    const schedule = this.getAll();
    const filtered = schedule.filter((s) => s.sectionId !== sectionId);
    saveToStorage(STORAGE_KEYS.SCHEDULE, filtered);
  },

  deleteByTeacherId(teacherId: string): void {
    const schedule = this.getAll();
    const filtered = schedule.filter((s) => s.teacherId !== teacherId);
    saveToStorage(STORAGE_KEYS.SCHEDULE, filtered);
  },

  deleteBySectionAndPeriod(sectionId: string, period: number): boolean {
    const schedule = this.getAll();
    const filtered = schedule.filter(
      (s) => !(s.sectionId === sectionId && s.period === period)
    );
    if (filtered.length === schedule.length) return false;

    saveToStorage(STORAGE_KEYS.SCHEDULE, filtered);
    return true;
  },
};

// ============================================================================
// Substitution Finder Logic
// ============================================================================

export const substitutionFinder = {
  /**
   * Find all teachers who are available (not assigned) during a specific period
   * @param period The period number (1-7)
   * @param excludeTeacherId Optional teacher ID to exclude (the absent teacher)
   * @returns Array of available teachers
   */
  findAvailableTeachers(
    period: number,
    excludeTeacherId?: string
  ): AvailableTeacher[] {
    const allTeachers = teacherStorage.getAll();
    const scheduleForPeriod = scheduleStorage.getByPeriod(period);

    // Get IDs of teachers who are busy during this period
    const busyTeacherIds = new Set(
      scheduleForPeriod.map((entry) => entry.teacherId)
    );

    // Filter out busy teachers and optionally the absent teacher
    const availableTeachers = allTeachers
      .filter((teacher) => {
        if (excludeTeacherId && teacher.id === excludeTeacherId) return false;
        return !busyTeacherIds.has(teacher.id);
      })
      .map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
      }));

    return availableTeachers;
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear all data from storage (useful for testing/reset)
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Export all data as JSON string
 */
export function exportData(): string {
  const data = {
    teachers: teacherStorage.getAll(),
    classes: classStorage.getAll(),
    sections: sectionStorage.getAll(),
    schedule: scheduleStorage.getAll(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON string
 */
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (data.teachers) saveToStorage(STORAGE_KEYS.TEACHERS, data.teachers);
    if (data.classes) saveToStorage(STORAGE_KEYS.CLASSES, data.classes);
    if (data.sections) saveToStorage(STORAGE_KEYS.SECTIONS, data.sections);
    if (data.schedule) saveToStorage(STORAGE_KEYS.SCHEDULE, data.schedule);

    return true;
  } catch (error) {
    console.error("Error importing data:", error);
    return false;
  }
}
