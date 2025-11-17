import { useState, useEffect } from "react";
import { classStorage } from "@/lib/storage";
import type { Class } from "@/lib/types";
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

interface ClassFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classItem: Class | null;
}

export function ClassForm({
  isOpen,
  onClose,
  onSuccess,
  classItem,
}: ClassFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (classItem) {
      setName(classItem.name);
    } else {
      setName("");
    }
    setError("");
  }, [classItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("الرجاء إدخال اسم الصف");
      return;
    }

    if (trimmedName.length < 2) {
      setError("اسم الصف يجب أن يكون حرفين على الأقل");
      return;
    }

    setIsSubmitting(true);

    try {
      if (classItem) {
        // Update existing class
        const updated = classStorage.update(classItem.id, trimmedName);
        if (!updated) {
          setError("فشل في تحديث الصف");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new class
        classStorage.create(trimmedName);
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
            {classItem ? "تعديل صف" : "إضافة صف جديد"}
          </DialogTitle>
          <DialogDescription>
            {classItem ? "قم بتعديل اسم الصف" : "أدخل اسم الصف الجديد"}
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
              <Label htmlFor="name">اسم الصف</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: الصف السادس"
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
                : classItem
                ? "تحديث"
                : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
