# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Manal** is a comprehensive school management system built with React, TypeScript, and Vite. The application is designed for Arabic-speaking users (RTL interface) to manage teachers, class schedules, find available substitute teachers, swap schedule assignments, and track teacher task completion.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server with HMR
pnpm dev

# Build for production (includes TypeScript compilation)
pnpm build

# Lint code
pnpm lint

# Preview production build
pnpm preview
```

## Tech Stack

- **React 19** with React Compiler enabled (affects dev/build performance)
- **TypeScript** with strict type checking
- **Vite 7** for build tooling
- **Tailwind CSS 4** via @tailwindcss/vite plugin
- **Radix UI** for accessible component primitives
- **shadcn/ui** component architecture
- **lucide-react** for icons

## Architecture Overview

### Data Model & State Management

The application uses **browser localStorage** for persistence with a centralized storage layer in `src/lib/storage.ts`. There is no backend - all data is client-side.

**Core entities:**
- **Teachers**: Individual instructors in the system
- **Classes**: Grade levels (e.g., "الصف السادس")
- **Sections**: Specific class sections (e.g., "الصف السادس أ", "الصف السادس ب")
- **Schedule Entries**: Assignments of teachers to specific sections and periods
- **Tasks**: Trackable assignments or duties for teachers to complete
- **Task Completions**: Records tracking which teachers have completed which tasks

**Key relationships:**
- Each Section belongs to one Class
- The schedule assigns one Teacher to one Section for one Period (1-7 periods per day)
- Each Task can have multiple Task Completions (one per teacher)
- Each Task Completion links one Teacher to one Task
- Deleting a Teacher cascades to remove their schedule entries and task completions
- Deleting a Class cascades to remove all its Sections and their schedule entries
- Deleting a Section cascades to remove all its schedule entries
- Deleting a Task cascades to remove all its task completions

**Storage layer** (`src/lib/storage.ts`):
- Provides CRUD operations for all entities via `teacherStorage`, `classStorage`, `sectionStorage`, `scheduleStorage`, `taskStorage`, `taskCompletionStorage`
- `substitutionFinder.findAvailableTeachers(period, excludeTeacherId?)` - core logic for finding free teachers
- Task management with completion tracking across teachers
- Data export/import functions for backup/restore
- All IDs are generated as `${Date.now()}-${randomString}`

### Component Structure

**Tab-based navigation** in `App.tsx` with 6 main sections:
1. **Substitution Finder** (`src/components/substitution/SubstitutionFinder.tsx`)
   - Select section and period
   - Shows assigned teacher for that slot
   - Mark teacher as absent → displays all available substitute teachers

2. **Schedule Swap** (`src/components/schedule/ScheduleSwap.tsx`)
   - Select two schedule entries (section + period for each)
   - Displays assigned teachers for both slots
   - Validates swap feasibility (checks for teacher conflicts)
   - Swaps teachers between the two selected periods

3. **Teacher Management** (`src/components/teachers/`)
   - `TeacherList.tsx`: List all teachers with add/edit/delete
   - `TeacherForm.tsx`: Form dialog for creating/editing teachers

4. **Class & Section Management** (`src/components/classes/`)
   - `ClassSectionManager.tsx`: Main container with tabs for classes vs sections
   - `ClassForm.tsx`: Form for creating/editing classes
   - `SectionForm.tsx`: Form for creating sections (requires selecting parent class)

5. **Schedule Management** (`src/components/schedule/ScheduleManager.tsx`)
   - Assign teachers to section-period combinations
   - View/edit the weekly schedule grid

6. **Task Tracker** (`src/components/tasks/`)
   - `TaskTracker.tsx`: Main container with tabs for completion tracking vs task management
   - `TaskForm.tsx`: Form dialog for creating/editing tasks
   - `TaskCompletionGrid.tsx`: Interactive grid showing completion status (teachers × tasks)

**UI Components** (`src/components/ui/`):
- shadcn/ui components following Radix UI patterns
- `src/lib/utils.ts` contains `cn()` utility for class name merging

### Important Conventions

- **RTL Layout**: The app is Arabic-first with `dir="rtl"` on the HTML root
- **Path Aliases**: `@/` maps to `src/` directory (configured in vite.config.ts)
- **Component Pattern**: Functional components with hooks, TypeScript interfaces from `src/lib/types.ts`
- **Styling**: Tailwind CSS with CSS variables for theming (not included in shadcn components but could be added)

### Substitution Finder Logic

The core algorithm in `substitutionFinder.findAvailableTeachers()`:
1. Fetch all teachers from storage
2. Get all schedule entries for the specified period
3. Create a Set of busy teacher IDs (teachers with assignments in that period)
4. Filter teachers: exclude busy teachers and optionally the absent teacher
5. Return available teachers

### Schedule Swap Logic

The swap algorithm in `ScheduleSwap.tsx` component:
1. User selects two entries (section + period for each)
2. System loads the assigned teacher for each entry
3. Validation checks before swap:
   - Both entries must have assigned teachers
   - Entries cannot be identical
   - Teacher A must not have another assignment at Period B
   - Teacher B must not have another assignment at Period A
4. If validation passes, execute swap by updating both schedule entries
5. Clear selections and reload data

### Task Tracker Logic

Task management and completion tracking:
1. **Task Management** (`TaskTracker.tsx`):
   - CRUD operations for tasks (name + description)
   - Display completion statistics per task
   - Calculate completion percentage based on teachers who completed

2. **Completion Tracking** (`TaskCompletionGrid.tsx`):
   - Display grid: tasks in rows, teachers in columns
   - Each cell shows completion status (checkbox)
   - Toggle completion creates/deletes task completion records
   - Real-time updates reflected in statistics

3. **Storage Operations**:
   - `taskStorage`: CRUD for tasks
   - `taskCompletionStorage`: Toggle completion status
   - `taskStorage.getAllWithCompletions()`: Join tasks with completion data

## Type Safety

- All data models defined in `src/lib/types.ts`
- TypeScript ~5.9.3 with strict checking
- TSConfig split into `tsconfig.app.json` (app code) and `tsconfig.node.json` (build config)

## Important Notes

- **React Compiler is enabled** - this uses `babel-plugin-react-compiler` and impacts Vite performance
- **No backend/API** - everything is localStorage-based
- **No authentication** - single-user application model
- **Data persistence** - relies entirely on browser localStorage; users should use export/import for backups
- **7 periods per day** - hardcoded constant in types.ts (`PERIODS_PER_DAY = 7`)
- **Section letters** - predefined Arabic letters in types.ts (`SECTION_LETTERS`)
