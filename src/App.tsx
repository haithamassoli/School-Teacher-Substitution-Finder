import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TeacherList } from "@/components/teachers/TeacherList";
import { ClassSectionManager } from "@/components/classes/ClassSectionManager";
import { ScheduleManager } from "@/components/schedule/ScheduleManager";
import { SubstitutionFinder } from "@/components/substitution/SubstitutionFinder";
import { TaskTracker } from "@/components/tasks/TaskTracker";
import { Search, Users, Layers, Calendar, GraduationCap, ClipboardCheck } from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("substitution");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                نظام إدارة البدلاء
              </h1>
              <p className="text-sm opacity-90 mt-1">
                إدارة المعلمين والجداول والبحث عن البدلاء
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-6">
        <Card className="shadow-xl">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Tab Navigation */}
              <div className="border-b bg-muted/30 overflow-x-auto">
                <TabsList className="w-full h-auto p-2 bg-transparent grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <TabsTrigger
                    value="substitution"
                    className="flex-col sm:flex-row gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs sm:text-sm font-semibold">
                      البحث عن بديل
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="teachers"
                    className="flex-col sm:flex-row gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-xs sm:text-sm font-semibold">
                      المعلمون
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="classes"
                    className="flex-col sm:flex-row gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Layers className="h-5 w-5" />
                    <span className="text-xs sm:text-sm font-semibold">
                      الصفوف والشعب
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="flex-col sm:flex-row gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs sm:text-sm font-semibold">
                      الجدول الدراسي
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="flex-col sm:flex-row gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <ClipboardCheck className="h-5 w-5" />
                    <span className="text-xs sm:text-sm font-semibold">
                      متابعة المهام
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[600px]">
                <TabsContent value="substitution" className="m-0">
                  <SubstitutionFinder />
                </TabsContent>
                <TabsContent value="teachers" className="m-0">
                  <TeacherList />
                </TabsContent>
                <TabsContent value="classes" className="m-0">
                  <ClassSectionManager />
                </TabsContent>
                <TabsContent value="schedule" className="m-0">
                  <ScheduleManager />
                </TabsContent>
                <TabsContent value="tasks" className="m-0">
                  <TaskTracker />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-6 text-center text-sm text-muted-foreground">
        <p>© 2025 نظام إدارة البدلاء - جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}

export default App;
