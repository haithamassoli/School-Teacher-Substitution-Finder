import { useState, useEffect } from "react";
import { sectionStorage } from "@/lib/storage";
import type { Class, Section } from "@/lib/types";
import { SECTION_LETTERS } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  section: Section | null;
  classItem: Class | null;
}

export function SectionForm({
  isOpen,
  onClose,
  onSuccess,
  section,
  classItem,
}: SectionFormProps) {
  const [sectionLetter, setSectionLetter] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (section) {
      setSectionLetter(section.sectionLetter);
    } else {
      setSectionLetter("");
    }
    setError("");
  }, [section, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sectionLetter) {
      setError("الرجاء اختيار حرف الشعبة");
      return;
    }

    if (!classItem) {
      setError("لم يتم تحديد الصف");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${classItem.name} ${sectionLetter}`;

      if (section) {
        // Update existing section
        const updated = sectionStorage.update(
          section.id,
          sectionLetter,
          fullName
        );
        if (!updated) {
          setError("فشل في تحديث الشعبة");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new section
        sectionStorage.create(classItem.id, sectionLetter, fullName);
      }

      onSuccess();
      setSectionLetter("");
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
            {section ? "تعديل شعبة" : "إضافة شعبة جديدة"}
          </DialogTitle>
          <DialogDescription>
            {classItem
              ? `${section ? "تعديل" : "إضافة"} شعبة لـ ${classItem.name}`
              : "اختر حرف الشعبة"}
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
              <Label htmlFor="letter">حرف الشعبة</Label>
              <Select
                value={sectionLetter}
                onValueChange={setSectionLetter}
                disabled={isSubmitting}
              >
                <SelectTrigger id="letter" className="text-lg">
                  <SelectValue placeholder="اختر حرف الشعبة" />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_LETTERS.map((letter) => (
                    <SelectItem key={letter} value={letter} className="text-lg">
                      {letter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sectionLetter && classItem && (
                <p className="text-sm text-muted-foreground">
                  الاسم الكامل: {classItem.name} {sectionLetter}
                </p>
              )}
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
                : section
                ? "تحديث"
                : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
