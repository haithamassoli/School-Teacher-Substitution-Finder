import { useEffect, useState } from "react";
import { ArrowLeftRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sectionStorage } from "@/lib/storage";
import { teacherStorage } from "@/lib/storage";
import { scheduleStorage } from "@/lib/storage";
import type { SectionWithClass, Teacher, ScheduleEntry } from "@/lib/types";
import { PERIODS_PER_DAY } from "@/lib/types";

interface SelectedEntry {
  sectionId: string;
  period: number;
  scheduleEntry: ScheduleEntry | null;
  teacher: Teacher | null;
  sectionName: string;
}

export function ScheduleSwap() {
  const [sections, setSections] = useState<SectionWithClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  // First entry selection
  const [firstSectionId, setFirstSectionId] = useState<string>("");
  const [firstPeriod, setFirstPeriod] = useState<string>("");
  const [firstEntry, setFirstEntry] = useState<SelectedEntry | null>(null);

  // Second entry selection
  const [secondSectionId, setSecondSectionId] = useState<string>("");
  const [secondPeriod, setSecondPeriod] = useState<string>("");
  const [secondEntry, setSecondEntry] = useState<SelectedEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSections(sectionStorage.getAllWithClassInfo());
    setTeachers(teacherStorage.getAll());
  };

  // Update first entry when section or period changes
  useEffect(() => {
    if (firstSectionId && firstPeriod) {
      loadEntry(firstSectionId, parseInt(firstPeriod), setFirstEntry);
    } else {
      setFirstEntry(null);
    }
  }, [firstSectionId, firstPeriod]);

  // Update second entry when section or period changes
  useEffect(() => {
    if (secondSectionId && secondPeriod) {
      loadEntry(secondSectionId, parseInt(secondPeriod), setSecondEntry);
    } else {
      setSecondEntry(null);
    }
  }, [secondSectionId, secondPeriod]);

  const loadEntry = (
    sectionId: string,
    period: number,
    setEntry: (entry: SelectedEntry | null) => void
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) {
      setEntry(null);
      return;
    }

    const scheduleEntry = scheduleStorage.getBySectionAndPeriod(sectionId, period) || null;
    const teacher = scheduleEntry
      ? teachers.find((t) => t.id === scheduleEntry.teacherId) || null
      : null;

    setEntry({
      sectionId,
      period,
      scheduleEntry,
      teacher,
      sectionName: section.name,
    });
  };

  const validateSwap = (): string | null => {
    if (!firstEntry || !secondEntry) {
      return "يرجى اختيار كلا الحصتين";
    }

    // Check that both entries have assigned teachers
    if (!firstEntry.scheduleEntry || !firstEntry.teacher) {
      return "الحصة الأولى ليس لها معلم مُعيّن";
    }

    if (!secondEntry.scheduleEntry || !secondEntry.teacher) {
      return "الحصة الثانية ليس لها معلم مُعيّن";
    }

    // Check for same selection
    if (
      firstEntry.sectionId === secondEntry.sectionId &&
      firstEntry.period === secondEntry.period
    ) {
      return "لا يمكن تبديل الحصة مع نفسها";
    }

    // Validate no conflicts after swap
    // After swap: Teacher A will teach at Section B/Period B, Teacher B will teach at Section A/Period A

    const teacherA = firstEntry.teacher;
    const teacherB = secondEntry.teacher;

    // Check if Teacher A would have a conflict at secondEntry's period
    // (excluding the secondEntry itself which will be replaced)
    const teacherASchedule = scheduleStorage
      .getByPeriod(secondEntry.period)
      .filter(
        (entry) =>
          entry.teacherId === teacherA.id &&
          entry.id !== secondEntry.scheduleEntry!.id
      );

    if (teacherASchedule.length > 0) {
      return `لا يمكن التبديل: المعلم ${teacherA.name} لديه حصة أخرى في الحصة ${secondEntry.period}`;
    }

    // Check if Teacher B would have a conflict at firstEntry's period
    // (excluding the firstEntry itself which will be replaced)
    const teacherBSchedule = scheduleStorage
      .getByPeriod(firstEntry.period)
      .filter(
        (entry) =>
          entry.teacherId === teacherB.id &&
          entry.id !== firstEntry.scheduleEntry!.id
      );

    if (teacherBSchedule.length > 0) {
      return `لا يمكن التبديل: المعلم ${teacherB.name} لديه حصة أخرى في الحصة ${firstEntry.period}`;
    }

    return null; // Valid swap
  };

  const handleSwap = () => {
    // Clear previous messages
    setError("");
    setSuccess("");

    // Validate
    const validationError = validateSwap();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!firstEntry?.scheduleEntry || !secondEntry?.scheduleEntry) {
      setError("خطأ في تحميل بيانات الحصص");
      return;
    }

    // Execute swap
    const updatedFirst = scheduleStorage.update(
      firstEntry.scheduleEntry.id,
      secondEntry.scheduleEntry.teacherId
    );
    const updatedSecond = scheduleStorage.update(
      secondEntry.scheduleEntry.id,
      firstEntry.scheduleEntry.teacherId
    );

    if (updatedFirst && updatedSecond) {
      setSuccess("تم تبديل الجداول بنجاح");
      setTimeout(() => setSuccess(""), 3000);

      // Clear selections
      setFirstSectionId("");
      setFirstPeriod("");
      setSecondSectionId("");
      setSecondPeriod("");
      setFirstEntry(null);
      setSecondEntry(null);

      // Reload data
      loadData();
    } else {
      setError("فشل في تبديل الجداول");
    }
  };

  const canSwap = firstEntry && secondEntry &&
    firstEntry.scheduleEntry && secondEntry.scheduleEntry;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">تبديل الجداول</CardTitle>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            قم بتبديل حصص المعلمين بين شعبتين مختلفتين
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="bg-secondary/20 border-secondary">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Selection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* First Entry Selection */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">الحصة الأولى</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section Select */}
                <div className="grid gap-2">
                  <Label htmlFor="first-section">اختر الشعبة</Label>
                  <Select value={firstSectionId} onValueChange={setFirstSectionId}>
                    <SelectTrigger id="first-section" className="text-lg">
                      <SelectValue placeholder="اختر الشعبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id} className="text-lg">
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Select */}
                <div className="grid gap-2">
                  <Label htmlFor="first-period">اختر رقم الحصة</Label>
                  <Select
                    value={firstPeriod}
                    onValueChange={setFirstPeriod}
                    disabled={!firstSectionId}
                  >
                    <SelectTrigger id="first-period" className="text-lg">
                      <SelectValue placeholder="اختر رقم الحصة" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: PERIODS_PER_DAY }, (_, i) => i + 1).map(
                        (period) => (
                          <SelectItem key={period} value={period.toString()} className="text-lg">
                            الحصة {period}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Teacher Display */}
                {firstEntry && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">المعلم المُعيّن:</p>
                    {firstEntry.teacher ? (
                      <p className="text-lg font-semibold">{firstEntry.teacher.name}</p>
                    ) : (
                      <p className="text-lg text-destructive">لا يوجد معلم مُعيّن</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Second Entry Selection */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">الحصة الثانية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section Select */}
                <div className="grid gap-2">
                  <Label htmlFor="second-section">اختر الشعبة</Label>
                  <Select value={secondSectionId} onValueChange={setSecondSectionId}>
                    <SelectTrigger id="second-section" className="text-lg">
                      <SelectValue placeholder="اختر الشعبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id} className="text-lg">
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Select */}
                <div className="grid gap-2">
                  <Label htmlFor="second-period">اختر رقم الحصة</Label>
                  <Select
                    value={secondPeriod}
                    onValueChange={setSecondPeriod}
                    disabled={!secondSectionId}
                  >
                    <SelectTrigger id="second-period" className="text-lg">
                      <SelectValue placeholder="اختر رقم الحصة" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: PERIODS_PER_DAY }, (_, i) => i + 1).map(
                        (period) => (
                          <SelectItem key={period} value={period.toString()} className="text-lg">
                            الحصة {period}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Teacher Display */}
                {secondEntry && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">المعلم المُعيّن:</p>
                    {secondEntry.teacher ? (
                      <p className="text-lg font-semibold">{secondEntry.teacher.name}</p>
                    ) : (
                      <p className="text-lg text-destructive">لا يوجد معلم مُعيّن</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Swap Summary */}
          {canSwap && (
            <Card className="bg-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">سيتم التبديل:</p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="text-sm">
                      <span className="font-semibold">{firstEntry!.teacher!.name}</span>
                      <span className="mx-2">←</span>
                      <span>{secondEntry!.sectionName} (الحصة {secondEntry!.period})</span>
                    </div>
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                    <div className="text-sm">
                      <span className="font-semibold">{secondEntry!.teacher!.name}</span>
                      <span className="mx-2">←</span>
                      <span>{firstEntry!.sectionName} (الحصة {firstEntry!.period})</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSwap}
              disabled={!canSwap}
              size="lg"
              className="w-full sm:w-auto min-w-[200px]"
            >
              <ArrowLeftRight className="ml-2 h-5 w-5" />
              تبديل الجداول
            </Button>
          </div>

          {/* Empty State */}
          {!firstSectionId && !secondSectionId && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">اختر الحصتين المراد تبديلهما</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
