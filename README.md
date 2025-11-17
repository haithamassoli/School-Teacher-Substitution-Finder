# Manal - نظام إدارة المدرسة الذكي

**Manal** is a comprehensive school management system designed for Arabic-speaking educational institutions. The application helps administrators manage teachers, class schedules, find available substitute teachers, adjust timetables, and track teacher task completion.

## Features

- **Substitution Finder**: Quickly identify available teachers for any period when a teacher is absent
- **Schedule Swap (Timetable Adjustment)**: Swap teacher assignments between different sections and periods with automatic conflict validation
- **Teacher Task Tracker**: Create, assign, and monitor task completion across all teachers with visual progress tracking
- **Teacher Management**: Add, edit, and remove teachers from the system
- **Class & Section Management**: Organize school structure with classes and sections
- **Schedule Management**: Assign teachers to specific sections and periods
- **Data Export/Import**: Backup and restore all data for safety
- **RTL Interface**: Full Arabic language support with right-to-left layout
- **Offline-First**: All data stored locally in browser (no backend required)
- **PWA Support**: Progressive Web App capabilities for mobile installation

## Tech Stack

- **React 19** with React Compiler for optimized performance
- **TypeScript** with strict type checking
- **Vite 7** for fast development and optimized builds
- **Tailwind CSS 4** for styling
- **Radix UI** for accessible component primitives
- **shadcn/ui** component architecture
- **lucide-react** for icons

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with HMR
pnpm dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
# Build for production (includes TypeScript compilation)
pnpm build

# Preview production build
pnpm preview
```

### Linting

```bash
# Lint code
pnpm lint
```

## Project Structure

```
src/
├── components/
│   ├── classes/         # Class and section management components
│   ├── schedule/        # Schedule management and swap components
│   ├── substitution/    # Substitution finder component
│   ├── tasks/           # Teacher task tracker components
│   ├── teachers/        # Teacher management components
│   └── ui/              # Reusable UI components (shadcn/ui)
├── lib/
│   ├── storage.ts       # localStorage-based data persistence layer
│   ├── types.ts         # TypeScript type definitions
│   └── utils.ts         # Utility functions
└── App.tsx              # Main application with tab navigation
```

## Data Model

The application manages six core entities:

- **Teachers**: Individual instructors in the system
- **Classes**: Grade levels (e.g., "الصف السادس")
- **Sections**: Specific class sections (e.g., "الصف السادس أ", "الصف السادس ب")
- **Schedule Entries**: Assignments of teachers to specific sections and periods (7 periods per day)
- **Tasks**: Trackable assignments or duties for teachers to complete
- **Task Completions**: Records tracking which teachers have completed which tasks

### Key Relationships

- Each Section belongs to one Class
- The schedule assigns one Teacher to one Section for one Period
- Each Task can have multiple Task Completions (one per teacher)
- Each Task Completion links one Teacher to one Task
- Deleting a Teacher cascades to remove their schedule entries and task completions
- Deleting a Class cascades to remove all its Sections and their schedule entries
- Deleting a Section cascades to remove all its schedule entries
- Deleting a Task cascades to remove all its task completions

## How It Works

### Substitution Finding Algorithm

Finds available substitute teachers when someone is absent:

1. User selects a section and period
2. System shows the assigned teacher for that slot
3. When marking a teacher as absent, the system:
   - Fetches all teachers from storage
   - Gets all schedule entries for the specified period
   - Identifies busy teachers (those with assignments in that period)
   - Returns available teachers who can substitute

### Schedule Swap Algorithm

Allows swapping teacher assignments between two different periods:

1. User selects two schedule entries (section + period for each)
2. System displays the assigned teachers for both slots
3. When initiating a swap, the system validates:
   - Both entries have assigned teachers
   - The entries are not identical
   - Neither teacher has conflicting assignments at the target period
4. If validation passes, teachers are swapped between the two slots
5. Schedule is updated and changes persist to localStorage

### Teacher Task Tracker

Manages task assignments and monitors completion across all teachers:

1. Administrator creates tasks with name and description
2. System displays task completion grid showing:
   - All tasks in rows
   - All teachers in columns
   - Completion status for each teacher-task combination
3. Administrators can toggle completion status for any teacher
4. System calculates and displays real-time completion statistics:
   - Percentage of teachers who completed each task
   - Number of completed vs total teachers per task
5. Tasks can be edited or deleted (with cascading deletion of completions)

## Data Persistence

- **Storage**: All data is stored in browser localStorage
- **No Backend**: Fully client-side application
- **No Authentication**: Single-user application model
- **Backups**: Users should regularly use the export/import feature to backup data

## Important Notes

- **React Compiler is enabled**: Uses `babel-plugin-react-compiler` which may impact Vite dev/build performance
- **Arabic-First Design**: The entire UI is designed for RTL layout
- **7 Periods Per Day**: Currently hardcoded (can be customized in `src/lib/types.ts`)
- **Browser Compatibility**: Requires modern browser with localStorage support

## Configuration

Path aliases are configured in `vite.config.ts`:
- `@/` maps to `src/` directory

TypeScript configuration is split into:
- `tsconfig.app.json` - Application code configuration
- `tsconfig.node.json` - Build tooling configuration

## Contributing

When working on this project:

1. Follow the existing component patterns and TypeScript interfaces
2. Maintain RTL compatibility in all UI components
3. Update `src/lib/types.ts` for any data model changes
4. Ensure all CRUD operations go through the storage layer (`src/lib/storage.ts`)
5. Test cascade deletions to prevent orphaned data

## License

[Your license here]
