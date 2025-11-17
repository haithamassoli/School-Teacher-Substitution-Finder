import { useState, useEffect } from "react";
import {
  sectionStorage,
  teacherStorage,
  scheduleStorage,
  substitutionFinder,
  migrateScheduleEntries,
} from "@/lib/storage";
import type { Section, Teacher, AvailableTeacher } from "@/lib/types";
import { getAllPeriods, getAllDays } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  UserX,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export function SubstitutionFinder() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(-1);
  const [assignedTeacher, setAssignedTeacher] = useState<Teacher | null>(
    null
  );
  const [isTeacherAbsent, setIsTeacherAbsent] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState<
    AvailableTeacher[]
  >([]);
  const [error, setError] = useState<string>("");

  const periods = getAllPeriods();
  const days = getAllDays();

  useEffect(() => {
    // Run migration on first mount
    migrateScheduleEntries();
    loadData();
  }, []);

  useEffect(() => {
    resetSearch();
  }, [selectedSectionId, selectedPeriod, selectedDayOfWeek]);

  const loadData = () => {
    setSections(sectionStorage.getAllWithClassInfo());
  };

  const resetSearch = () => {
    setIsTeacherAbsent(false);
    setAvailableTeachers([]);
    setAssignedTeacher(null);
    setError("");

    if (selectedSectionId && selectedPeriod && selectedDayOfWeek >= 0) {
      loadAssignedTeacher();
    }
  };

  const loadAssignedTeacher = () => {
    if (!selectedSectionId || !selectedPeriod || selectedDayOfWeek < 0) return;

    const scheduleEntry = scheduleStorage.getBySectionAndPeriod(
      selectedSectionId,
      selectedPeriod,
      selectedDayOfWeek
    );

    if (!scheduleEntry) {
      setError("لم يتم تعيين معلم لهذه الحصة في هذا اليوم");
      setAssignedTeacher(null);
      return;
    }

    const teacher = teacherStorage.getById(scheduleEntry.teacherId);
    setAssignedTeacher(teacher || null);
  };

  const handleMarkAbsent = () => {
    if (!selectedPeriod || selectedDayOfWeek < 0 || !assignedTeacher) return;

    setIsTeacherAbsent(true);
    setError("");

    // Find available teachers for this period on this day (excluding the absent teacher)
    const available = substitutionFinder.findAvailableTeachers(
      selectedPeriod,
      selectedDayOfWeek,
      assignedTeacher.id
    );
    setAvailableTeachers(available);
  };

  const handleReset = () => {
    setSelectedSectionId("");
    setSelectedPeriod(0);
    setSelectedDayOfWeek(-1);
    resetSearch();
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedPeriodInfo = periods.find((p) => p.number === selectedPeriod);
  const selectedDayInfo = days.find((d) => d.number === selectedDayOfWeek);

  const canSearch =
    selectedSectionId && selectedPeriod && selectedDayOfWeek >= 0 && assignedTeacher && !error;

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card className="border-2 border-primary/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Search className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">
              البحث عن معلم بديل
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            اختر الشعبة والحصة للبحث عن المعلمين المتاحين
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selection Form */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Section Selector */}
            <div className="grid gap-2">
              <Label htmlFor="section">الشعبة</Label>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
              >
                <SelectTrigger id="section" className="text-lg">
                  <SelectValue placeholder="اختر الشعبة" />
                </SelectTrigger>
                <SelectContent>
                  {sections.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      لا توجد شعب
                    </div>
                  ) : (
                    sections.map((section) => (
                      <SelectItem
                        key={section.id}
                        value={section.id}
                        className="text-lg"
                      >
                        {section.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Day Selector */}
            <div className="grid gap-2">
              <Label htmlFor="day">اليوم</Label>
              <Select
                value={selectedDayOfWeek >= 0 ? selectedDayOfWeek.toString() : ""}
                onValueChange={(value) => setSelectedDayOfWeek(parseInt(value))}
              >
                <SelectTrigger id="day" className="text-lg">
                  <SelectValue placeholder="اختر اليوم" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem
                      key={day.number}
                      value={day.number.toString()}
                      className="text-lg"
                    >
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selector */}
            <div className="grid gap-2">
              <Label htmlFor="period">الحصة</Label>
              <Select
                value={selectedPeriod.toString()}
                onValueChange={(value) => setSelectedPeriod(parseInt(value))}
              >
                <SelectTrigger id="period" className="text-lg">
                  <SelectValue placeholder="اختر الحصة" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem
                      key={period.number}
                      value={period.number.toString()}
                      className="text-lg"
                    >
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Selection Display */}
          {selectedSection && selectedDayInfo && selectedPeriodInfo && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      التحديد الحالي
                    </p>
                    <p className="text-lg font-semibold">
                      {selectedSection.name} - {selectedDayInfo.label} - {selectedPeriodInfo.label}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    إعادة تعيين
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Assigned Teacher Display */}
          {assignedTeacher && !error && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      المعلم المسؤول عن هذه الحصة
                    </p>
                    <h3 className="text-xl font-bold mt-1">
                      {assignedTeacher.name}
                    </h3>
                  </div>
                  <Badge
                    variant={isTeacherAbsent ? "destructive" : "secondary"}
                    className="text-base px-3 py-1"
                  >
                    {isTeacherAbsent ? "غائب" : "حاضر"}
                  </Badge>
                </div>
              </CardHeader>
              {!isTeacherAbsent && (
                <CardContent>
                  <Button
                    onClick={handleMarkAbsent}
                    variant="destructive"
                    className="w-full gap-2"
                    size="lg"
                  >
                    <UserX className="h-5 w-5" />
                    <span>تعليم المعلم كغائب والبحث عن بديل</span>
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {/* Available Teachers List */}
          {isTeacherAbsent && (
            <Card className="border-2 border-secondary/50 bg-secondary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-secondary" />
                  <div>
                    <CardTitle className="text-xl">
                      المعلمون المتاحون
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      المعلمون الذين ليس لديهم حصص في هذا الوقت
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {availableTeachers.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>لا يوجد معلمون متاحون</strong>
                      <br />
                      جميع المعلمين مشغولون في حصص أخرى خلال هذا الوقت.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <Alert className="bg-secondary/20 border-secondary">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        تم العثور على {availableTeachers.length} معلم متاح
                      </AlertDescription>
                    </Alert>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {availableTeachers.map((teacher) => (
                        <Card
                          key={teacher.id}
                          className="hover:shadow-md transition-shadow hover:border-secondary"
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <p className="font-semibold text-lg">
                                  {teacher.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  متاح للتدريس
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Initial State */}
          {!canSearch && !error && !assignedTeacher && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">اختر الشعبة والحصة للبدء</p>
              <p className="text-sm mt-2">
                سيتم عرض المعلم المسؤول والمعلمين المتاحين للبدل
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
