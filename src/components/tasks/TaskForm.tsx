import { useState, useEffect } from "react";
import { taskStorage } from "@/lib/storage";
import type { Task } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
}

export function TaskForm({
  isOpen,
  onClose,
  onSuccess,
  task,
}: TaskFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError("");
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("الرجاء إدخال اسم المهمة");
      return;
    }

    if (trimmedName.length < 2) {
      setError("اسم المهمة يجب أن يكون حرفين على الأقل");
      return;
    }

    setIsSubmitting(true);

    try {
      if (task) {
        // Update existing task
        const updated = taskStorage.update(
          task.id,
          trimmedName,
          description.trim() || undefined
        );
        if (!updated) {
          setError("فشل في تحديث المهمة");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new task
        taskStorage.create(trimmedName, description.trim() || undefined);
      }

      onSuccess();
      setName("");
      setDescription("");
    } catch (err) {
      setError("حدث خطأ أثناء حفظ البيانات");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {task ? "تعديل مهمة" : "إضافة مهمة جديدة"}
          </DialogTitle>
          <DialogDescription>
            {task
              ? "قم بتعديل معلومات المهمة"
              : "أدخل معلومات المهمة الجديدة"}
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
              <Label htmlFor="name">اسم المهمة</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: دفتر الحضور"
                autoFocus
                disabled={isSubmitting}
                className="text-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف تفصيلي للمهمة..."
                disabled={isSubmitting}
                rows={3}
                className="resize-none"
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
                : task
                ? "تحديث"
                : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
