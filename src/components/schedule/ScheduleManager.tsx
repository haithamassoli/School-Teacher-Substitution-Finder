import { useState, useEffect } from "react";
import { sectionStorage, teacherStorage, scheduleStorage } from "@/lib/storage";
import type { SectionWithClass, Teacher, ScheduleEntry } from "@/lib/types";
import { getAllPeriods } from "@/lib/types";
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

  useEffect(() => {
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

  const getTeacherForPeriod = (period: number): Teacher | null => {
    const entry = schedule.find((s) => s.period === period);
    if (!entry) return null;
    return teachers.find((t) => t.id === entry.teacherId) || null;
  };

  const handleAssignTeacher = (period: number, teacherId: string) => {
    if (!selectedSectionId) return;

    try {
      scheduleStorage.create(selectedSectionId, period, teacherId);
      loadScheduleForSection(selectedSectionId);
      setSuccess(`تم تعيين المعلم للحصة ${period}`);
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("فشل في تعيين المعلم");
      console.error(err);
    }
  };

  const handleRemoveTeacher = (period: number) => {
    if (!selectedSectionId) return;

    if (window.confirm(`هل تريد إزالة المعلم من الحصة ${period}؟`)) {
      const success = scheduleStorage.deleteBySectionAndPeriod(
        selectedSectionId,
        period
      );
      if (success) {
        loadScheduleForSection(selectedSectionId);
        setSuccess(`تم إزالة المعلم من الحصة ${period}`);
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
                      7 حصص يومياً
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
                          <TableHead className="text-right font-bold">
                            الحصة
                          </TableHead>
                          <TableHead className="text-right font-bold">
                            المعلم
                          </TableHead>
                          <TableHead className="text-right font-bold">
                            الإجراءات
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {periods.map((period) => {
                          const assignedTeacher = getTeacherForPeriod(
                            period.number
                          );
                          return (
                            <TableRow key={period.number}>
                              <TableCell className="font-semibold">
                                <Badge variant="outline">{period.label}</Badge>
                              </TableCell>
                              <TableCell>
                                {assignedTeacher ? (
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-secondary" />
                                    <span className="font-medium">
                                      {assignedTeacher.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    لم يتم التعيين
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Select
                                    value={assignedTeacher?.id || ""}
                                    onValueChange={(teacherId) =>
                                      handleAssignTeacher(
                                        period.number,
                                        teacherId
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue placeholder="اختر معلم" />
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
                                        handleRemoveTeacher(period.number)
                                      }
                                      className="gap-1"
                                    >
                                      <X className="h-4 w-4" />
                                      <span>إزالة</span>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
