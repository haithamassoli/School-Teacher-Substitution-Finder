# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Manal** is a school teacher substitution management system built with React, TypeScript, and Vite. The application is designed for Arabic-speaking users (RTL interface) to manage teachers, class schedules, and find available substitute teachers when someone is absent.

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

**Key relationships:**
- Each Section belongs to one Class
- The schedule assigns one Teacher to one Section for one Period (1-7 periods per day)
- Deleting a Teacher cascades to remove their schedule entries
- Deleting a Class cascades to remove all its Sections and their schedule entries
- Deleting a Section cascades to remove all its schedule entries

**Storage layer** (`src/lib/storage.ts`):
- Provides CRUD operations for all entities via `teacherStorage`, `classStorage`, `sectionStorage`, `scheduleStorage`
- `substitutionFinder.findAvailableTeachers(period, excludeTeacherId?)` - core logic for finding free teachers
- Data export/import functions for backup/restore
- All IDs are generated as `${Date.now()}-${randomString}`

### Component Structure

**Tab-based navigation** in `App.tsx` with 4 main sections:
1. **Substitution Finder** (`src/components/substitution/SubstitutionFinder.tsx`)
   - Select section and period
   - Shows assigned teacher for that slot
   - Mark teacher as absent → displays all available substitute teachers

2. **Teacher Management** (`src/components/teachers/`)
   - `TeacherList.tsx`: List all teachers with add/edit/delete
   - `TeacherForm.tsx`: Form dialog for creating/editing teachers

3. **Class & Section Management** (`src/components/classes/`)
   - `ClassSectionManager.tsx`: Main container with tabs for classes vs sections
   - `ClassForm.tsx`: Form for creating/editing classes
   - `SectionForm.tsx`: Form for creating sections (requires selecting parent class)

4. **Schedule Management** (`src/components/schedule/ScheduleManager.tsx`)
   - Assign teachers to section-period combinations
   - View/edit the weekly schedule grid

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

This is the primary value proposition of the application.

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
