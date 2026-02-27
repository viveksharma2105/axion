import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendance } from "@/features/attendance/hooks/use-attendance";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useMarksSummary } from "@/features/marks/hooks/use-marks";
import { useTodaySchedule } from "@/features/timetable/hooks/use-timetable";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  LinkIcon,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CollegeLink {
  id: string;
  collegeSlug: string;
  syncStatus: string;
  lastSyncAt: string | null;
}

function useCollegeLinks() {
  return useQuery({
    queryKey: queryKeys.collegeLinks.all,
    queryFn: () => api.get<CollegeLink[]>("/college-links"),
    select: (data) => data.data,
  });
}

export function DashboardPage() {
  const { data: links, isLoading } = useCollegeLinks();
  const hasLinks = links && links.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here&apos;s an overview of your academics.
        </p>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : !hasLinks ? (
        <NoCollegeLinked />
      ) : (
        <DashboardContent />
      )}
    </div>
  );
}

function NoCollegeLinked() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <LinkIcon className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No college linked</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Link your college account to view your attendance, marks, and schedule
        </p>
        <Link to="/settings">
          <Button className="mt-4">Link College</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { data: attendance, isLoading: attendanceLoading } = useAttendance();
  const { data: todaySchedule, isLoading: scheduleLoading } =
    useTodaySchedule();
  const { data: summary, isLoading: summaryLoading } = useMarksSummary();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  const overallAttendance =
    attendance && attendance.length > 0
      ? attendance.reduce((sum, r) => sum + r.percentage, 0) / attendance.length
      : null;

  const belowThreshold = attendance
    ? attendance.filter((r) => r.percentage < r.threshold).length
    : 0;

  const latestGpa =
    summary && summary.length > 0 ? summary[summary.length - 1] : null;

  const totalClasses = todaySchedule?.length ?? null;

  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance"
          icon={GraduationCap}
          linkTo="/attendance"
          linkLabel="View details"
          isLoading={attendanceLoading}
        >
          {overallAttendance !== null ? (
            <>
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  overallAttendance >= 75 && "text-attendance-safe",
                  overallAttendance < 75 &&
                    overallAttendance >= 70 &&
                    "text-attendance-warning",
                  overallAttendance < 70 && "text-attendance-danger",
                )}
              >
                {overallAttendance.toFixed(1)}%
              </p>
              {belowThreshold > 0 && (
                <p className="text-xs text-attendance-danger">
                  {belowThreshold} subject{belowThreshold > 1 ? "s" : ""} below
                  threshold
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </StatCard>

        <StatCard
          title="Today's Classes"
          icon={Calendar}
          linkTo="/timetable"
          linkLabel="View schedule"
          isLoading={scheduleLoading}
        >
          {totalClasses !== null ? (
            <>
              <p className="text-3xl font-bold tabular-nums">{totalClasses}</p>
              <p className="text-xs text-muted-foreground">
                {totalClasses === 0
                  ? "No classes today"
                  : `class${totalClasses > 1 ? "es" : ""} scheduled`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </StatCard>

        <StatCard
          title="Current CGPA"
          icon={BarChart3}
          linkTo="/marks"
          linkLabel="View marks"
          isLoading={summaryLoading}
        >
          {latestGpa ? (
            <>
              <p className="text-3xl font-bold tabular-nums">
                {latestGpa.cgpa.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                SGPA: {latestGpa.sgpa.toFixed(2)} &middot; Sem{" "}
                {latestGpa.semester}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </StatCard>

        <StatCard
          title="Courses"
          icon={BookOpen}
          linkTo="/courses"
          linkLabel="View courses"
          isLoading={coursesLoading}
        >
          {courses ? (
            <>
              <p className="text-3xl font-bold tabular-nums">
                {courses.length}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {courses.reduce((sum, c) => sum + c.credits, 0)} total credits
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </StatCard>
      </div>

      {/* Second row: Today's schedule + attendance chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <TodayScheduleCard
          schedule={todaySchedule ?? null}
          isLoading={scheduleLoading}
        />
        <AttendanceChartCard
          attendance={attendance ?? null}
          isLoading={attendanceLoading}
        />
      </div>

      {/* Third row: GPA trend */}
      {summary && summary.length > 1 && <GpaTrendCard summary={summary} />}
    </div>
  );
}

interface StatCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  linkTo: string;
  linkLabel: string;
  isLoading: boolean;
  children: React.ReactNode;
}

function StatCard({
  title,
  icon: Icon,
  linkTo,
  linkLabel,
  isLoading,
  children,
}: StatCardProps) {
  return (
    <Link to={linkTo} className="block">
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </>
          ) : (
            <div className="space-y-1">
              {children}
              <p className="text-xs text-muted-foreground">
                {linkLabel} &rarr;
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface TodayScheduleEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  instructor: string;
}

interface TodayScheduleCardProps {
  schedule: TodayScheduleEntry[] | null;
  isLoading: boolean;
}

function TodayScheduleCard({ schedule, isLoading }: TodayScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Today&apos;s Schedule
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !schedule || schedule.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No classes scheduled today
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedule.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="shrink-0 text-center">
                  <p className="text-sm font-semibold tabular-nums">
                    {entry.startTime}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {entry.endTime}
                  </p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.courseTitle}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.courseCode}
                    </Badge>
                    {entry.room && (
                      <span className="text-xs text-muted-foreground">
                        {entry.room}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <Link to="/timetable">
              <p className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground">
                View full schedule &rarr;
              </p>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AttendanceRecord {
  courseCode: string;
  courseTitle: string;
  present: number;
  total: number;
  percentage: number;
  threshold: number;
  lastUpdated: string;
}

interface AttendanceChartCardProps {
  attendance: AttendanceRecord[] | null;
  isLoading: boolean;
}

function getBarColor(percentage: number, threshold: number) {
  if (percentage >= threshold) return "hsl(var(--chart-1))";
  if (percentage >= threshold - 5) return "hsl(var(--chart-3))";
  return "hsl(var(--chart-2))";
}

function AttendanceChartCard({
  attendance,
  isLoading,
}: AttendanceChartCardProps) {
  const chartData =
    attendance?.map((r) => ({
      name: r.courseCode,
      percentage: Math.round(r.percentage * 10) / 10,
      threshold: r.threshold,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5" />
          Attendance Overview
        </CardTitle>
        <CardDescription>Subject-wise attendance percentage</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full sm:h-[300px]" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No attendance data available
            </p>
          </div>
        ) : (
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground font-mono"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--card-foreground))",
                    fontVariantNumeric: "tabular-nums",
                  }}
                  formatter={(value) => [`${value}%`, "Attendance"]}
                />
                <Legend />
                <Bar
                  dataKey="percentage"
                  name="Attendance %"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={getBarColor(entry.percentage, entry.threshold)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GpaSummary {
  semester: number;
  sgpa: number;
  cgpa: number;
  creditsEarned: number;
  totalCredits: number;
}

function GpaTrendCard({ summary }: { summary: GpaSummary[] }) {
  const chartData = summary.map((s) => ({
    name: `Sem ${s.semester}`,
    sgpa: s.sgpa,
    cgpa: s.cgpa,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          GPA Trend
        </CardTitle>
        <CardDescription>SGPA and CGPA across semesters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--card-foreground))",
                  fontVariantNumeric: "tabular-nums",
                }}
                formatter={(value) => [Number(value).toFixed(2)]}
              />
              <Legend />
              <Bar
                dataKey="sgpa"
                name="SGPA"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cgpa"
                name="CGPA"
                fill="hsl(var(--chart-4))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full sm:h-[300px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
