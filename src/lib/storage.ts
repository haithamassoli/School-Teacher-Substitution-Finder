import type {
  Teacher,
  Class,
  Section,
  ScheduleEntry,
  SectionWithClass,
  ScheduleEntryWithDetails,
  AvailableTeacher,
  Task,
  TaskCompletion,
  TaskCompletionWithDetails,
  TaskWithCompletions,
  TeacherWithCompletions,
} from "./types";

// Storage keys
const STORAGE_KEYS = {
  TEACHERS: "school_teachers",
  CLASSES: "school_classes",
  SECTIONS: "school_sections",
  SCHEDULE: "school_schedule",
  TASKS: "school_tasks",
  TASK_COMPLETIONS: "school_task_completions",
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

    // Auto-create task completions for all existing tasks
    const allTasks = taskStorage.getAll();
    allTasks.forEach((task) => {
      taskCompletionStorage.create(task.id, newTeacher.id, false);
    });

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

    // Cascade delete all schedule entries for this teacher
    scheduleStorage.deleteByTeacherId(id);

    // Cascade delete all task completions for this teacher
    taskCompletionStorage.deleteByTeacherId(id);

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

  getByPeriod(period: number, dayOfWeek?: number): ScheduleEntry[] {
    return this.getAll().filter((s) => {
      if (dayOfWeek !== undefined) {
        return s.period === period && s.dayOfWeek === dayOfWeek;
      }
      return s.period === period;
    });
  },

  getBySectionAndPeriod(
    sectionId: string,
    period: number,
    dayOfWeek?: number
  ): ScheduleEntry | undefined {
    return this.getAll().find((s) => {
      if (dayOfWeek !== undefined) {
        return s.sectionId === sectionId && s.period === period && s.dayOfWeek === dayOfWeek;
      }
      return s.sectionId === sectionId && s.period === period;
    });
  },

  getBySectionPeriodAndDay(
    sectionId: string,
    period: number,
    dayOfWeek: number
  ): ScheduleEntry | undefined {
    return this.getAll().find(
      (s) => s.sectionId === sectionId && s.period === period && s.dayOfWeek === dayOfWeek
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
    dayOfWeek: number,
    teacherId: string
  ): ScheduleEntry | null {
    // Check if entry already exists for this section, period, and day
    const existing = this.getBySectionPeriodAndDay(sectionId, period, dayOfWeek);
    if (existing) {
      return this.update(existing.id, teacherId);
    }

    const schedule = this.getAll();
    const newEntry: ScheduleEntry = {
      id: generateId(),
      sectionId,
      period,
      dayOfWeek,
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

  deleteBySectionAndPeriod(sectionId: string, period: number, dayOfWeek?: number): boolean {
    const schedule = this.getAll();
    const filtered = schedule.filter((s) => {
      if (dayOfWeek !== undefined) {
        return !(s.sectionId === sectionId && s.period === period && s.dayOfWeek === dayOfWeek);
      }
      return !(s.sectionId === sectionId && s.period === period);
    });
    if (filtered.length === schedule.length) return false;

    saveToStorage(STORAGE_KEYS.SCHEDULE, filtered);
    return true;
  },
};

// ============================================================================
// Task Operations
// ============================================================================

export const taskStorage = {
  getAll(): Task[] {
    return getFromStorage<Task>(STORAGE_KEYS.TASKS);
  },

  getById(id: string): Task | undefined {
    return this.getAll().find((t) => t.id === id);
  },

  create(name: string, description?: string): Task {
    const tasks = this.getAll();
    const newTask: Task = {
      id: generateId(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: Date.now(),
    };
    tasks.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);

    // Auto-create task completions for all existing teachers
    const allTeachers = teacherStorage.getAll();
    allTeachers.forEach((teacher) => {
      taskCompletionStorage.create(newTask.id, teacher.id, false);
    });

    return newTask;
  },

  update(id: string, name: string, description?: string): Task | null {
    const tasks = this.getAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      name: name.trim(),
      description: description?.trim(),
    };
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    return tasks[index];
  },

  delete(id: string): boolean {
    const tasks = this.getAll();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;

    // Cascade delete all completions for this task
    taskCompletionStorage.deleteByTaskId(id);

    saveToStorage(STORAGE_KEYS.TASKS, filtered);
    return true;
  },

  getWithCompletions(taskId: string): TaskWithCompletions | null {
    const task = this.getById(taskId);
    if (!task) return null;

    const completions = taskCompletionStorage.getByTaskId(taskId);
    const completedCount = completions.filter((c) => c.completed).length;
    const totalTeachers = teacherStorage.getAll().length;

    return {
      ...task,
      completions,
      completedCount,
      totalTeachers,
      completionPercentage:
        totalTeachers > 0 ? Math.round((completedCount / totalTeachers) * 100) : 0,
    };
  },

  getAllWithCompletions(): TaskWithCompletions[] {
    const tasks = this.getAll();
    return tasks
      .map((task) => this.getWithCompletions(task.id))
      .filter((t): t is TaskWithCompletions => t !== null);
  },
};

// ============================================================================
// Task Completion Operations
// ============================================================================

export const taskCompletionStorage = {
  getAll(): TaskCompletion[] {
    return getFromStorage<TaskCompletion>(STORAGE_KEYS.TASK_COMPLETIONS);
  },

  getById(id: string): TaskCompletion | undefined {
    return this.getAll().find((tc) => tc.id === id);
  },

  getByTaskId(taskId: string): TaskCompletion[] {
    return this.getAll().filter((tc) => tc.taskId === taskId);
  },

  getByTeacherId(teacherId: string): TaskCompletion[] {
    return this.getAll().filter((tc) => tc.teacherId === teacherId);
  },

  getByTaskAndTeacher(
    taskId: string,
    teacherId: string
  ): TaskCompletion | undefined {
    return this.getAll().find(
      (tc) => tc.taskId === taskId && tc.teacherId === teacherId
    );
  },

  create(taskId: string, teacherId: string, completed: boolean): TaskCompletion {
    const completions = this.getAll();
    const newCompletion: TaskCompletion = {
      id: generateId(),
      taskId,
      teacherId,
      completed,
      completedAt: completed ? Date.now() : undefined,
      createdAt: Date.now(),
    };
    completions.push(newCompletion);
    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, completions);
    return newCompletion;
  },

  update(
    id: string,
    completed: boolean,
    notes?: string
  ): TaskCompletion | null {
    const completions = this.getAll();
    const index = completions.findIndex((tc) => tc.id === id);
    if (index === -1) return null;

    completions[index] = {
      ...completions[index],
      completed,
      completedAt: completed ? Date.now() : undefined,
      notes: notes?.trim(),
    };
    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, completions);
    return completions[index];
  },

  toggleCompletion(
    taskId: string,
    teacherId: string,
    notes?: string
  ): TaskCompletion {
    const existing = this.getByTaskAndTeacher(taskId, teacherId);

    if (existing) {
      // Toggle existing completion
      return this.update(existing.id, !existing.completed, notes) || existing;
    } else {
      // Create new completion as completed
      const newCompletion = this.create(taskId, teacherId, true);
      if (notes) {
        return this.update(newCompletion.id, true, notes) || newCompletion;
      }
      return newCompletion;
    }
  },

  delete(id: string): boolean {
    const completions = this.getAll();
    const filtered = completions.filter((tc) => tc.id !== id);
    if (filtered.length === completions.length) return false;

    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, filtered);
    return true;
  },

  deleteByTaskId(taskId: string): void {
    const completions = this.getAll();
    const filtered = completions.filter((tc) => tc.taskId !== taskId);
    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, filtered);
  },

  deleteByTeacherId(teacherId: string): void {
    const completions = this.getAll();
    const filtered = completions.filter((tc) => tc.teacherId !== teacherId);
    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, filtered);
  },

  getAllWithDetails(): TaskCompletionWithDetails[] {
    const completions = this.getAll();
    const tasks = taskStorage.getAll();
    const teachers = teacherStorage.getAll();

    return completions.map((completion) => {
      const task = tasks.find((t) => t.id === completion.taskId);
      const teacher = teachers.find((t) => t.id === completion.teacherId);

      return {
        ...completion,
        taskName: task?.name || "غير معروف",
        teacherName: teacher?.name || "غير معروف",
      };
    });
  },

  // Bulk operations
  markAllCompleteForTask(taskId: string): void {
    const completions = this.getAll();
    const updated = completions.map((tc) => {
      if (tc.taskId === taskId && !tc.completed) {
        return {
          ...tc,
          completed: true,
          completedAt: Date.now(),
        };
      }
      return tc;
    });
    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, updated);
  },

  resetAllForTask(taskId: string): void {
    const completions = this.getAll();
    const updated = completions.map((tc) => {
      if (tc.taskId === taskId && tc.completed) {
        return {
          ...tc,
          completed: false,
          completedAt: undefined,
          notes: undefined,
        };
      }
      return tc;
    });
    saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, updated);
  },

  // Get teachers with their completion data for grid view
  getTeachersWithCompletions(): TeacherWithCompletions[] {
    const teachers = teacherStorage.getAll();
    const tasks = taskStorage.getAll();
    const allCompletions = this.getAll();

    return teachers.map((teacher) => {
      const teacherCompletions = allCompletions.filter(
        (tc) => tc.teacherId === teacher.id
      );

      const completionsMap = new Map<string, TaskCompletion>();
      teacherCompletions.forEach((tc) => {
        completionsMap.set(tc.taskId, tc);
      });

      const completedCount = teacherCompletions.filter((tc) => tc.completed).length;
      const totalTasks = tasks.length;

      return {
        teacher,
        completions: completionsMap,
        completedCount,
        totalTasks,
        completionPercentage:
          totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
      };
    });
  },
};

// ============================================================================
// Substitution Finder Logic
// ============================================================================

export const substitutionFinder = {
  /**
   * Find all teachers who are available (not assigned) during a specific period on a specific day
   * @param period The period number (1-7)
   * @param dayOfWeek The day of week (0-4)
   * @param excludeTeacherId Optional teacher ID to exclude (the absent teacher)
   * @returns Array of available teachers
   */
  findAvailableTeachers(
    period: number,
    dayOfWeek: number,
    excludeTeacherId?: string
  ): AvailableTeacher[] {
    const allTeachers = teacherStorage.getAll();
    const scheduleForPeriod = scheduleStorage.getByPeriod(period, dayOfWeek);

    // Get IDs of teachers who are busy during this period on this day
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
    tasks: taskStorage.getAll(),
    taskCompletions: taskCompletionStorage.getAll(),
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
    if (data.tasks) saveToStorage(STORAGE_KEYS.TASKS, data.tasks);
    if (data.taskCompletions) saveToStorage(STORAGE_KEYS.TASK_COMPLETIONS, data.taskCompletions);

    return true;
  } catch (error) {
    console.error("Error importing data:", error);
    return false;
  }
}

/**
 * Migrate existing schedule entries to include dayOfWeek field
 * This function assigns all entries without a dayOfWeek to day 0 (Sunday/الأحد)
 */
export function migrateScheduleEntries(): void {
  const schedule = scheduleStorage.getAll();
  let needsMigration = false;

  const migrated = schedule.map((entry) => {
    // Check if entry is missing dayOfWeek field
    if (entry.dayOfWeek === undefined || entry.dayOfWeek === null) {
      needsMigration = true;
      return {
        ...entry,
        dayOfWeek: 0, // Assign to Sunday (الأحد)
      };
    }
    return entry;
  });

  if (needsMigration) {
    saveToStorage(STORAGE_KEYS.SCHEDULE, migrated);
    console.log("Schedule entries migrated to include dayOfWeek field");
  }
}
