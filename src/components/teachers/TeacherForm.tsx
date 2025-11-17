import { useState, useEffect } from "react";
import { teacherStorage } from "@/lib/storage";
import type { Teacher } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: Teacher | null;
}

export function TeacherForm({
  isOpen,
  onClose,
  onSuccess,
  teacher,
}: TeacherFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacher) {
      setName(teacher.name);
    } else {
      setName("");
    }
    setError("");
  }, [teacher, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("الرجاء إدخال اسم المعلم");
      return;
    }

    if (trimmedName.length < 2) {
      setError("اسم المعلم يجب أن يكون حرفين على الأقل");
      return;
    }

    setIsSubmitting(true);

    try {
      if (teacher) {
        // Update existing teacher
        const updated = teacherStorage.update(teacher.id, trimmedName);
        if (!updated) {
          setError("فشل في تحديث المعلم");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new teacher
        teacherStorage.create(trimmedName);
      }

      onSuccess();
      setName("");
    } catch (err) {
      setError("حدث خطأ أثناء حفظ البيانات");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {teacher ? "تعديل معلم" : "إضافة معلم جديد"}
          </DialogTitle>
          <DialogDescription>
            {teacher
              ? "قم بتعديل معلومات المعلم"
              : "أدخل اسم المعلم الجديد"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">اسم المعلم</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: الأستاذة فاطمة"
                autoFocus
                disabled={isSubmitting}
                className="text-lg"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "جاري الحفظ..."
                : teacher
                ? "تحديث"
                : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
