import { useState, useMemo } from "react";
import { taskStorage, taskCompletionStorage } from "@/lib/storage";
import type { Task, TeacherWithCompletions } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Search, CheckCheck, RotateCcw } from "lucide-react";

type FilterStatus = "all" | "completed" | "incomplete";
type SortBy = "name" | "completion" | "taskCount";

interface TaskCompletionGridProps {
  onRefresh: () => void;
}

export function TaskCompletionGrid({ onRefresh }: TaskCompletionGridProps) {
  const [tasks, setTasks] = useState<Task[]>(taskStorage.getAll());
  const [teachersWithCompletions, setTeachersWithCompletions] = useState<
    TeacherWithCompletions[]
  >(taskCompletionStorage.getTeachersWithCompletions());

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [successMessage, setSuccessMessage] = useState("");

  // Notes dialog state
  const [notesDialog, setNotesDialog] = useState<{
    isOpen: boolean;
    taskId: string;
    teacherId: string;
    taskName: string;
    teacherName: string;
    currentNotes: string;
  } | null>(null);
  const [notes, setNotes] = useState("");

  const refreshData = () => {
    setTasks(taskStorage.getAll());
    setTeachersWithCompletions(
      taskCompletionStorage.getTeachersWithCompletions()
    );
    onRefresh();
  };

  const handleToggleCompletion = (taskId: string, teacherId: string) => {
    taskCompletionStorage.toggleCompletion(taskId, teacherId);
    refreshData();
  };

  const handleCellClick = (
    taskId: string,
    teacherId: string,
    taskName: string,
    teacherName: string
  ) => {
    const completion = taskCompletionStorage.getByTaskAndTeacher(
      taskId,
      teacherId
    );

    if (completion && completion.completed) {
      // Open notes dialog for completed tasks
      setNotesDialog({
        isOpen: true,
        taskId,
        teacherId,
        taskName,
        teacherName,
        currentNotes: completion.notes || "",
      });
      setNotes(completion.notes || "");
    } else {
      // Just toggle completion
      handleToggleCompletion(taskId, teacherId);
    }
  };

  const handleSaveNotes = () => {
    if (!notesDialog) return;

    const completion = taskCompletionStorage.getByTaskAndTeacher(
      notesDialog.taskId,
      notesDialog.teacherId
    );

    if (completion) {
      taskCompletionStorage.update(completion.id, completion.completed, notes);
      refreshData();
    }

    setNotesDialog(null);
    setNotes("");
  };

  const handleBulkMarkComplete = (taskId: string) => {
    if (
      window.confirm(
        "هل أنت متأكد من تعيين هذه المهمة كمكتملة لجميع المعلمين؟"
      )
    ) {
      taskCompletionStorage.markAllCompleteForTask(taskId);
      refreshData();
      setSuccessMessage("تم تعيين المهمة كمكتملة لجميع المعلمين");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const handleBulkReset = (taskId: string) => {
    if (
      window.confirm("هل أنت متأكد من إعادة تعيين هذه المهمة لجميع المعلمين؟")
    ) {
      taskCompletionStorage.resetAllForTask(taskId);
      refreshData();
      setSuccessMessage("تم إعادة تعيين المهمة لجميع المعلمين");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Filtering and sorting
  const filteredAndSortedTeachers = useMemo(() => {
    let filtered = [...teachersWithCompletions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((t) =>
        t.teacher.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus === "completed") {
      filtered = filtered.filter((t) => t.completedCount === t.totalTasks);
    } else if (filterStatus === "incomplete") {
      filtered = filtered.filter((t) => t.completedCount < t.totalTasks);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.teacher.name.localeCompare(b.teacher.name, "ar");
        case "completion":
          return b.completionPercentage - a.completionPercentage;
        case "taskCount":
          return b.completedCount - a.completedCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [teachersWithCompletions, searchQuery, filterStatus, sortBy]);

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>لا توجد مهام بعد</p>
            <p className="text-sm mt-2">قم بإضافة مهام جديدة للبدء في المتابعة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (teachersWithCompletions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p>لا يوجد معلمون بعد</p>
            <p className="text-sm mt-2">
              قم بإضافة معلمين من قسم إدارة المعلمين
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الفلترة والبحث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">بحث عن معلم</Label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="ابحث باسم المعلم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter">حالة الإنجاز</Label>
                <Select
                  value={filterStatus}
                  onValueChange={(value) =>
                    setFilterStatus(value as FilterStatus)
                  }
                >
                  <SelectTrigger id="filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="incomplete">غير مكتمل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort">الترتيب حسب</Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortBy)}
                >
                  <SelectTrigger id="sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">الاسم (أ-ي)</SelectItem>
                    <SelectItem value="completion">نسبة الإنجاز</SelectItem>
                    <SelectItem value="taskCount">عدد المهام المكتملة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Grid Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky right-0 bg-background min-w-[200px] font-bold">
                      المعلم
                    </TableHead>
                    {tasks.map((task) => (
                      <TableHead key={task.id} className="text-center min-w-[140px]">
                        <div className="space-y-2">
                          <div className="font-semibold">{task.name}</div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground font-normal">
                              {task.description}
                            </div>
                          )}
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBulkMarkComplete(task.id)}
                              className="h-7 px-2 text-xs"
                              title="تعيين الكل كمكتمل"
                            >
                              <CheckCheck className="h-3 w-3 ml-1" />
                              الكل
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBulkReset(task.id)}
                              className="h-7 px-2 text-xs"
                              title="إعادة تعيين الكل"
                            >
                              <RotateCcw className="h-3 w-3 ml-1" />
                              إعادة
                            </Button>
                          </div>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold sticky left-0 bg-background min-w-[120px]">
                      التقدم
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTeachers.map((teacherData) => (
                    <TableRow key={teacherData.teacher.id}>
                      <TableCell className="sticky right-0 bg-background font-medium">
                        {teacherData.teacher.name}
                      </TableCell>
                      {tasks.map((task) => {
                        const completion = teacherData.completions.get(task.id);
                        const isCompleted = completion?.completed || false;

                        return (
                          <TableCell key={task.id} className="text-center p-2">
                            <button
                              onClick={() =>
                                handleCellClick(
                                  task.id,
                                  teacherData.teacher.id,
                                  task.name,
                                  teacherData.teacher.name
                                )
                              }
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border-2 transition-all hover:scale-110 ${
                                isCompleted
                                  ? "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                              }`}
                              title={
                                isCompleted
                                  ? "انقر لإضافة أو تعديل الملاحظات"
                                  : "انقر للتعيين كمكتمل"
                              }
                            >
                              {isCompleted ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <X className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            {completion?.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                📝
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center sticky left-0 bg-background">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={
                              teacherData.completionPercentage === 100
                                ? "default"
                                : "secondary"
                            }
                            className="min-w-[60px]"
                          >
                            {teacherData.completionPercentage}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {teacherData.completedCount}/{teacherData.totalTasks}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredAndSortedTeachers.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p>لا توجد نتائج</p>
                <p className="text-sm mt-2">جرب تغيير معايير البحث أو الفلترة</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes Dialog */}
      {notesDialog && (
        <Dialog
          open={notesDialog.isOpen}
          onOpenChange={() => setNotesDialog(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>إضافة ملاحظات</DialogTitle>
              <DialogDescription>
                المهمة: {notesDialog.taskName} - المعلم: {notesDialog.teacherName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notes">الملاحظات</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أضف ملاحظات اختيارية..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotesDialog(null)}
              >
                إلغاء
              </Button>
              <Button type="button" onClick={handleSaveNotes}>
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
