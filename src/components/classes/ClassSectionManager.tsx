import { useState } from "react";
import { classStorage, sectionStorage } from "@/lib/storage";
import type { Class, Section } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClassForm } from "./ClassForm";
import { SectionForm } from "./SectionForm";
import { PlusCircle, Pencil, Trash2, Layers } from "lucide-react";

export function ClassSectionManager() {
  const [classes, setClasses] = useState<Class[]>(classStorage.getAll());
  const [sections, setSections] = useState<Section[]>(
    sectionStorage.getAll()
  );
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedClassForSection, setSelectedClassForSection] =
    useState<Class | null>(null);
  const [error, setError] = useState<string>("");

  const refreshData = () => {
    setClasses(classStorage.getAll());
    setSections(sectionStorage.getAll());
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setIsClassFormOpen(true);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setIsClassFormOpen(true);
  };

  const handleDeleteClass = (classItem: Class) => {
    const classSections = sections.filter(
      (s) => s.classId === classItem.id
    );
    const confirmMessage =
      classSections.length > 0
        ? `هل أنت متأكد من حذف الصف "${classItem.name}"؟\nسيتم حذف ${classSections.length} شعبة مرتبطة بهذا الصف.`
        : `هل أنت متأكد من حذف الصف "${classItem.name}"؟`;

    if (window.confirm(confirmMessage)) {
      const success = classStorage.delete(classItem.id);
      if (success) {
        refreshData();
        setError("");
      } else {
        setError("فشل في حذف الصف");
      }
    }
  };

  const handleAddSection = (classItem: Class) => {
    setSelectedClassForSection(classItem);
    setEditingSection(null);
    setIsSectionFormOpen(true);
  };

  const handleEditSection = (section: Section) => {
    const classItem = classes.find((c) => c.id === section.classId);
    setSelectedClassForSection(classItem || null);
    setEditingSection(section);
    setIsSectionFormOpen(true);
  };

  const handleDeleteSection = (section: Section) => {
    if (window.confirm(`هل أنت متأكد من حذف الشعبة: ${section.name}؟`)) {
      const success = sectionStorage.delete(section.id);
      if (success) {
        refreshData();
        setError("");
      } else {
        setError("فشل في حذف الشعبة");
      }
    }
  };

  const getSectionsForClass = (classId: string) => {
    return sections.filter((s) => s.classId === classId);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">
            إدارة الصفوف والشعب
          </CardTitle>
          <Button onClick={handleAddClass} className="gap-2">
            <PlusCircle className="h-5 w-5" />
            <span>إضافة صف</span>
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {classes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">لا يوجد صفوف حالياً</p>
              <p className="text-sm mt-2">
                قم بإضافة صف جديد باستخدام الزر أعلاه
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem) => {
                const classSections = getSectionsForClass(classItem.id);
                return (
                  <Card
                    key={classItem.id}
                    className="border-2 hover:border-primary/50 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Layers className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="text-xl font-bold">
                              {classItem.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {classSections.length} شعبة
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSection(classItem)}
                            className="gap-1"
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span>إضافة شعبة</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClass(classItem)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClass(classItem)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {classSections.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          لا توجد شعب لهذا الصف
                        </div>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {classSections.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {section.sectionLetter}
                                </Badge>
                                <span className="font-medium">
                                  {section.name}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSection(section)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSection(section)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ClassForm
        isOpen={isClassFormOpen}
        onClose={() => {
          setIsClassFormOpen(false);
          setEditingClass(null);
        }}
        onSuccess={() => {
          refreshData();
          setIsClassFormOpen(false);
          setEditingClass(null);
        }}
        classItem={editingClass}
      />

      <SectionForm
        isOpen={isSectionFormOpen}
        onClose={() => {
          setIsSectionFormOpen(false);
          setEditingSection(null);
          setSelectedClassForSection(null);
        }}
        onSuccess={() => {
          refreshData();
          setIsSectionFormOpen(false);
          setEditingSection(null);
          setSelectedClassForSection(null);
        }}
        section={editingSection}
        classItem={selectedClassForSection}
      />
    </div>
  );
}
