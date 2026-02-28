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
import {
  type AttendanceRecord,
  useAttendance,
} from "@/features/attendance/hooks/use-attendance";
import { useCourses } from "@/features/courses/hooks/use-courses";
import { useMarksSummary } from "@/features/marks/hooks/use-marks";
import { useStudentProfile } from "@/features/profile/hooks/use-student-profile";
import {
  type TimetableEntry,
  useTodaySchedule,
} from "@/features/timetable/hooks/use-timetable";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
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

const DEFAULT_THRESHOLD = 75;

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
  const { data: profile } = useStudentProfile();
  const hasLinks = links && links.length > 0;

  const firstName = profile?.studentName
    ? profile.studentName.trim().split(/\s+/)[0]
    : null;
  const greeting = firstName
    ? `Welcome back, ${firstName.charAt(0)}${firstName.slice(1).toLowerCase()}.`
    : "Welcome back.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {greeting} Here&apos;s an overview of your academics.
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
        <h3 className="mt-4 text-lg font-semibold tracking-tight">
          No college linked
        </h3>
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
  const { data: summary } = useMarksSummary();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  const overallAttendance =
    attendance && attendance.length > 0
      ? attendance.reduce((sum, r) => sum + (r.percentage ?? 0), 0) /
        attendance.length
      : null;

  const belowThreshold = attendance
    ? attendance.filter((r) => (r.percentage ?? 0) < DEFAULT_THRESHOLD).length
    : 0;

  const totalClasses = todaySchedule?.length ?? null;

  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  overallAttendance >= DEFAULT_THRESHOLD &&
                    "text-attendance-safe",
                  overallAttendance < DEFAULT_THRESHOLD &&
                    overallAttendance >= DEFAULT_THRESHOLD - 5 &&
                    "text-attendance-warning",
                  overallAttendance < DEFAULT_THRESHOLD - 5 &&
                    "text-attendance-danger",
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
                {courses.reduce((sum, c) => sum + (c.credits ?? 0), 0)} total
                credits
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

interface TodayScheduleCardProps {
  schedule: TimetableEntry[] | null;
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
                    {entry.courseName ?? "Unknown Course"}
                  </p>
                  <div className="flex items-center gap-2">
                    {entry.courseCode && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {entry.courseCode}
                      </Badge>
                    )}
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

interface AttendanceChartCardProps {
  attendance: AttendanceRecord[] | null;
  isLoading: boolean;
}

function getBarColor(percentage: number) {
  if (percentage >= DEFAULT_THRESHOLD) return "var(--chart-1)";
  if (percentage >= DEFAULT_THRESHOLD - 5) return "var(--chart-3)";
  return "var(--chart-2)";
}

function AttendanceChartCard({
  attendance,
  isLoading,
}: AttendanceChartCardProps) {
  const chartData =
    attendance?.map((r) => ({
      name: r.courseCode,
      courseName: r.courseName,
      percentage: Math.round((r.percentage ?? 0) * 10) / 10,
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
          <Skeleton className="h-52 w-full sm:h-72" />
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No attendance data available
            </p>
          </div>
        ) : (
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 30 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fontSize: 11,
                    fill: "var(--muted-foreground)",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{
                    fill: "color-mix(in oklch, var(--muted) 30%, transparent)",
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div
                        className="rounded-lg border bg-card px-3 py-2 shadow-md"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        <p className="text-sm font-medium text-card-foreground">
                          {data.courseName}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {data.name}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-card-foreground">
                          {data.percentage}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="percentage"
                  name="Attendance %"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={getBarColor(entry.percentage)}
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

interface GpaTrendCardProps {
  summary: GpaSummary[];
}

function GpaTrendCard({ summary }: GpaTrendCardProps) {
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
        <div className="h-52 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--card-foreground)",
                  fontVariantNumeric: "tabular-nums",
                }}
                cursor={{
                  fill: "color-mix(in oklch, var(--muted) 30%, transparent)",
                }}
                formatter={(value) => [Number(value).toFixed(2)]}
              />
              <Legend />
              <Bar
                dataKey="sgpa"
                name="SGPA"
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
              <Bar
                dataKey="cgpa"
                name="CGPA"
                fill="var(--chart-4)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
            <Skeleton className="h-52 w-full sm:h-72" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
