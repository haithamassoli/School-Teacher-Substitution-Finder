import { useState } from "react";
import { teacherStorage } from "@/lib/storage";
import type { Teacher } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeacherForm } from "./TeacherForm";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

export function TeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>(
    teacherStorage.getAll()
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  const refreshTeachers = () => {
    setTeachers(teacherStorage.getAll());
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setIsFormOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleDelete = (teacher: Teacher) => {
    if (window.confirm(`هل أنت متأكد من حذف المعلم: ${teacher.name}؟`)) {
      const success = teacherStorage.delete(teacher.id);
      if (success) {
        refreshTeachers();
        setDeleteError("");
      } else {
        setDeleteError("فشل في حذف المعلم");
      }
    }
  };

  const handleFormSuccess = () => {
    refreshTeachers();
    setIsFormOpen(false);
    setEditingTeacher(null);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">
            إدارة المعلمين
          </CardTitle>
          <Button onClick={handleAdd} className="gap-2">
            <PlusCircle className="h-5 w-5" />
            <span>إضافة معلم</span>
          </Button>
        </CardHeader>
        <CardContent>
          {deleteError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          {teachers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">لا يوجد معلمين حالياً</p>
              <p className="text-sm mt-2">
                قم بإضافة معلم جديد باستخدام الزر أعلاه
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((teacher) => (
                <Card
                  key={teacher.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">
                        {teacher.name}
                      </h3>
                      <Badge variant="secondary">معلم</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(teacher)}
                        className="flex-1 gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>تعديل</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(teacher)}
                        className="flex-1 gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>حذف</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeacherForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTeacher(null);
        }}
        onSuccess={handleFormSuccess}
        teacher={editingTeacher}
      />
    </div>
  );
}
