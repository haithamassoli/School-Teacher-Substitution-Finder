import { useState, useEffect } from "react";
import {
  sectionStorage,
  teacherStorage,
  scheduleStorage,
  migrateScheduleEntries,
} from "@/lib/storage";
import type { SectionWithClass, Teacher, ScheduleEntry } from "@/lib/types";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, UserCheck, X } from "lucide-react";

export function ScheduleManager() {
  const [sections, setSections] = useState<SectionWithClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const periods = getAllPeriods();
  const days = getAllDays();

  useEffect(() => {
    // Run migration on first mount
    migrateScheduleEntries();
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      loadScheduleForSection(selectedSectionId);
    }
  }, [selectedSectionId]);

  const loadData = () => {
    setSections(sectionStorage.getAllWithClassInfo());
    setTeachers(teacherStorage.getAll());
  };

  const loadScheduleForSection = (sectionId: string) => {
    const sectionSchedule = scheduleStorage.getBySectionId(sectionId);
    setSchedule(sectionSchedule);
  };

  const getTeacherForPeriodAndDay = (
    period: number,
    dayOfWeek: number
  ): Teacher | null => {
    const entry = schedule.find(
      (s) => s.period === period && s.dayOfWeek === dayOfWeek
    );
    if (!entry) return null;
    return teachers.find((t) => t.id === entry.teacherId) || null;
  };

  const handleAssignTeacher = (
    period: number,
    dayOfWeek: number,
    teacherId: string
  ) => {
    if (!selectedSectionId) return;

    try {
      scheduleStorage.create(selectedSectionId, period, dayOfWeek, teacherId);
      loadScheduleForSection(selectedSectionId);
      setSuccess(
        `تم تعيين المعلم للحصة ${period} يوم ${days[dayOfWeek].label}`
      );
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("فشل في تعيين المعلم");
      console.error(err);
    }
  };

  const handleRemoveTeacher = (period: number, dayOfWeek: number) => {
    if (!selectedSectionId) return;

    if (
      window.confirm(
        `هل تريد إزالة المعلم من الحصة ${period} يوم ${days[dayOfWeek].label}؟`
      )
    ) {
      const success = scheduleStorage.deleteBySectionAndPeriod(
        selectedSectionId,
        period,
        dayOfWeek
      );
      if (success) {
        loadScheduleForSection(selectedSectionId);
        setSuccess(
          `تم إزالة المعلم من الحصة ${period} يوم ${days[dayOfWeek].label}`
        );
        setError("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("فشل في إزالة المعلم");
      }
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">
              إدارة الجدول الدراسي
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert className="bg-secondary/20 border-secondary">
              <AlertDescription className="text-secondary-foreground">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Section Selector */}
          <div className="grid gap-2">
            <Label htmlFor="section">اختر الشعبة</Label>
            <Select
              value={selectedSectionId}
              onValueChange={setSelectedSectionId}
            >
              <SelectTrigger id="section" className="text-lg">
                <SelectValue placeholder="اختر الشعبة لعرض جدولها" />
              </SelectTrigger>
              <SelectContent>
                {sections.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    لا توجد شعب. قم بإضافة شعبة أولاً.
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

          {selectedSection && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedSection.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      8 حصص × 5 أيام أسبوعياً
                    </p>
                  </div>
                  <Badge variant="outline" className="text-base">
                    {selectedSection.className}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {teachers.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      لا يوجد معلمين. قم بإضافة معلمين أولاً لتعيينهم في الجدول.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center font-bold border-l">
                            الحصة
                          </TableHead>
                          {days.map((day) => (
                            <TableHead
                              key={day.number}
                              className="text-center font-bold min-w-[200px]"
                            >
                              {day.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {periods.map((period) => (
                          <TableRow key={period.number}>
                            <TableCell className="font-semibold text-center border-l bg-muted/30">
                              {/* <Badge variant="outline">{period.label}</Badge> */}
                            </TableCell>
                            {days.map((day) => {
                              const assignedTeacher = getTeacherForPeriodAndDay(
                                period.number,
                                day.number
                              );
                              return (
                                <TableCell
                                  key={`${period.number}-${day.number}`}
                                  className="p-2"
                                >
                                  <div className="flex flex-col gap-2">
                                    {assignedTeacher ? (
                                      <div className="flex items-center gap-1 text-sm">
                                        <UserCheck className="h-3 w-3 text-secondary flex-shrink-0" />
                                        <span className="font-medium truncate">
                                          {assignedTeacher.name}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        لم يتم التعيين
                                      </span>
                                    )}
                                    <div className="flex gap-1">
                                      <Select
                                        value={assignedTeacher?.id || ""}
                                        onValueChange={(teacherId) =>
                                          handleAssignTeacher(
                                            period.number,
                                            day.number,
                                            teacherId
                                          )
                                        }
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="اختر" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teachers.map((teacher) => (
                                            <SelectItem
                                              key={teacher.id}
                                              value={teacher.id}
                                            >
                                              {teacher.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {assignedTeacher && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveTeacher(
                                              period.number,
                                              day.number
                                            )
                                          }
                                          className="h-8 w-8 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!selectedSectionId && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">اختر شعبة لعرض وتعديل جدولها الدراسي</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
