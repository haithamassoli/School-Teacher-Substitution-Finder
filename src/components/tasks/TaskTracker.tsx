import { useState } from "react";
import { taskStorage } from "@/lib/storage";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskForm } from "./TaskForm";
import { TaskCompletionGrid } from "./TaskCompletionGrid";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";

export function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>(taskStorage.getAll());
  const [tasksWithStats, setTasksWithStats] = useState(
    taskStorage.getAllWithCompletions()
  );
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("completion");

  const refreshData = () => {
    setTasks(taskStorage.getAll());
    setTasksWithStats(taskStorage.getAllWithCompletions());
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    const confirmMessage = `هل أنت متأكد من حذف المهمة "${task.name}"؟\nسيتم حذف جميع سجلات الإنجاز المرتبطة بهذه المهمة.`;

    if (window.confirm(confirmMessage)) {
      const success = taskStorage.delete(task.id);
      if (success) {
        refreshData();
        setError("");
      } else {
        setError("فشل في حذف المهمة");
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              متابعة مهام المعلمين
            </CardTitle>
            <Button onClick={handleAddTask} className="gap-2">
              <PlusCircle className="h-5 w-5" />
              <span>إضافة مهمة</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="completion" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span>متابعة الإنجاز</span>
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>إدارة المهام</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="m-0">
          <TaskCompletionGrid onRefresh={refreshData} />
        </TabsContent>

        <TabsContent value="manage" className="m-0">
          <Card>
            <CardContent className="pt-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">لا توجد مهام حالياً</p>
                  <p className="text-sm mt-2">
                    قم بإضافة مهمة جديدة باستخدام الزر أعلاه
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasksWithStats.map((taskData) => (
                    <Card
                      key={taskData.id}
                      className="border-2 hover:border-primary/50 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <ClipboardList className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="text-lg font-bold">
                                  {taskData.name}
                                </h3>
                                {taskData.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {taskData.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mr-8">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  التقدم:
                                </span>
                                <Badge
                                  variant={
                                    taskData.completionPercentage === 100
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {taskData.completionPercentage}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  المكتمل:
                                </span>
                                <Badge variant="outline">
                                  {taskData.completedCount}/{taskData.totalTeachers}{" "}
                                  معلم
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTask(taskData)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTask(taskData)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => {
          refreshData();
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />
    </div>
  );
}
