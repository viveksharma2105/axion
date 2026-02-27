import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAttendance,
  useAttendanceProjection,
} from "@/features/attendance/hooks/use-attendance";
import { cn } from "@/lib/utils";
import { AlertCircle, Calculator, GraduationCap } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_THRESHOLD = 75;

export function AttendancePage() {
  const { data: attendance, isLoading, error, refetch } = useAttendance();
  const { data: projections } = useAttendanceProjection();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Your attendance across all subjects this semester
        </p>
      </div>

      {isLoading ? (
        <AttendanceSkeleton />
      ) : error ? (
        <AttendanceError onRetry={() => refetch()} />
      ) : !attendance || attendance.length === 0 ? (
        <AttendanceEmpty />
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              label="Overall"
              value={
                attendance.length > 0
                  ? (
                      attendance.reduce(
                        (sum, r) => sum + (r.percentage ?? 0),
                        0,
                      ) / attendance.length
                    ).toFixed(1)
                  : "0.0"
              }
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tabular-nums">
                  {attendance.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Below Threshold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tabular-nums text-attendance-danger">
                  {
                    attendance.filter(
                      (r) => (r.percentage ?? 0) < DEFAULT_THRESHOLD,
                    ).length
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visual Overview</CardTitle>
              <CardDescription>
                Attendance percentage by subject
              </CardDescription>
            </CardHeader>
            <CardContent className="-mx-2 sm:mx-0">
              <div className="h-[240px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendance.map((r) => ({
                      name: r.courseCode,
                      courseName: r.courseName,
                      percentage: Math.round((r.percentage ?? 0) * 10) / 10,
                    }))}
                    margin={{ top: 5, right: 10, left: -15, bottom: 40 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 9,
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
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
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
                      {attendance.map((r) => {
                        const pct = r.percentage ?? 0;
                        return (
                          <Cell
                            key={r.courseCode}
                            fill={
                              pct >= DEFAULT_THRESHOLD
                                ? "var(--chart-1)"
                                : pct >= DEFAULT_THRESHOLD - 5
                                  ? "var(--chart-3)"
                                  : "var(--chart-2)"
                            }
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance table — desktop */}
          <Card className="hidden sm:block">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Subject-wise Breakdown
                  </CardTitle>
                  <CardDescription>
                    Attendance details for each course
                  </CardDescription>
                </div>
                <BunkCalculatorDialog attendance={attendance} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right tabular-nums">
                        Present
                      </TableHead>
                      <TableHead className="text-right tabular-nums">
                        Absent
                      </TableHead>
                      <TableHead className="text-right tabular-nums">
                        Total
                      </TableHead>
                      <TableHead className="text-right tabular-nums">
                        %
                      </TableHead>
                      {projections && (
                        <TableHead className="text-right">Status</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => {
                      const projection = projections?.find(
                        (p) => p.courseCode === record.courseCode,
                      );
                      return (
                        <TableRow key={record.courseCode}>
                          <TableCell>
                            <div>
                              <span className="font-mono text-sm">
                                {record.courseCode}
                              </span>
                              <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                                {record.courseName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.totalPresent}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.totalAbsent}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.totalLectures}
                          </TableCell>
                          <TableCell className="text-right">
                            <AttendanceBadge
                              value={record.percentage ?? 0}
                              threshold={DEFAULT_THRESHOLD}
                            />
                          </TableCell>
                          {projections && (
                            <TableCell className="text-right">
                              {projection && (
                                <span className="text-xs text-muted-foreground">
                                  {projection.classesCanSkip > 0
                                    ? `Can skip ${projection.classesCanSkip}`
                                    : projection.classesNeededForThreshold > 0
                                      ? `Need ${projection.classesNeededForThreshold} more`
                                      : "On track"}
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Attendance cards — mobile */}
          <div className="space-y-3 sm:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Subject-wise Breakdown
              </h2>
              <BunkCalculatorDialog attendance={attendance} />
            </div>
            {attendance.map((record) => {
              const projection = projections?.find(
                (p) => p.courseCode === record.courseCode,
              );
              return (
                <Card key={record.courseCode}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-sm">
                          {record.courseCode}
                        </span>
                        <p className="truncate text-xs text-muted-foreground">
                          {record.courseName}
                        </p>
                      </div>
                      <AttendanceBadge
                        value={record.percentage ?? 0}
                        threshold={DEFAULT_THRESHOLD}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground tabular-nums">
                      <span>
                        Present:{" "}
                        <span className="font-medium text-foreground">
                          {record.totalPresent}
                        </span>
                      </span>
                      <span>
                        Absent:{" "}
                        <span className="font-medium text-foreground">
                          {record.totalAbsent}
                        </span>
                      </span>
                      <span>
                        Total:{" "}
                        <span className="font-medium text-foreground">
                          {record.totalLectures}
                        </span>
                      </span>
                    </div>
                    {projection && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {projection.classesCanSkip > 0
                          ? `Can skip ${projection.classesCanSkip} classes`
                          : projection.classesNeededForThreshold > 0
                            ? `Need ${projection.classesNeededForThreshold} more classes`
                            : "On track"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bunk Calculator                                                    */
/* ------------------------------------------------------------------ */

interface AttendanceEntry {
  courseCode: string;
  courseName: string | null;
  totalLectures: number;
  totalPresent: number;
  percentage: number | null;
}

interface BunkCalculatorDialogProps {
  attendance: AttendanceEntry[];
}

function BunkCalculatorDialog({ attendance }: BunkCalculatorDialogProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [bunkCount, setBunkCount] = useState<string>("");

  const course = attendance.find((r) => r.courseCode === selectedCourse);

  const bunkNum = Number(bunkCount || 0);
  const totalAfter = course ? course.totalLectures + bunkNum : 0;
  const presentAfter = course ? course.totalPresent : 0;
  const percentageAfter =
    totalAfter > 0 ? (presentAfter / totalAfter) * 100 : 0;

  const hasResult = course && bunkNum > 0;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedCourse("");
      setBunkCount("");
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calculator className="h-4 w-4" />
          <span className="hidden sm:inline">Bunk Calculator</span>
          <span className="sm:hidden">Calculate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bunk Calculator</DialogTitle>
          <DialogDescription>
            See how your attendance changes if you skip classes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Course selector */}
          <div className="space-y-2">
            <Label htmlFor="bunk-course">Course</Label>
            <select
              id="bunk-course"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setBunkCount("");
              }}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" className="bg-popover text-popover-foreground">
                Select a course
              </option>
              {attendance.map((r) => (
                <option
                  key={r.courseCode}
                  value={r.courseCode}
                  className="bg-popover text-popover-foreground"
                >
                  {r.courseCode}
                  {r.courseName ? ` — ${r.courseName}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Classes to skip */}
          <div className="space-y-2">
            <Label htmlFor="bunk-count">Classes to skip</Label>
            <Input
              id="bunk-count"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              placeholder="e.g. 3"
              value={bunkCount}
              onChange={(e) => setBunkCount(e.target.value)}
              disabled={!selectedCourse}
              className="h-10"
            />
          </div>

          {/* Current stats */}
          {course && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Current
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center tabular-nums">
                <div>
                  <p className="text-lg font-semibold">{course.totalPresent}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {course.totalLectures}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {(course.percentage ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {hasResult && (
            <div
              className={cn(
                "rounded-lg border p-3",
                percentageAfter >= DEFAULT_THRESHOLD &&
                  "border-attendance-safe/30 bg-attendance-safe/5",
                percentageAfter < DEFAULT_THRESHOLD &&
                  percentageAfter >= DEFAULT_THRESHOLD - 5 &&
                  "border-attendance-warning/30 bg-attendance-warning/5",
                percentageAfter < DEFAULT_THRESHOLD - 5 &&
                  "border-attendance-danger/30 bg-attendance-danger/5",
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">
                After skipping {bunkNum} class{bunkNum !== 1 ? "es" : ""}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center tabular-nums">
                <div>
                  <p className="text-lg font-semibold">{presentAfter}</p>
                  <p className="text-xs text-muted-foreground">Present</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{totalAfter}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      percentageAfter >= DEFAULT_THRESHOLD &&
                        "text-attendance-safe",
                      percentageAfter < DEFAULT_THRESHOLD &&
                        percentageAfter >= DEFAULT_THRESHOLD - 5 &&
                        "text-attendance-warning",
                      percentageAfter < DEFAULT_THRESHOLD - 5 &&
                        "text-attendance-danger",
                    )}
                  >
                    {percentageAfter.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Projected</p>
                </div>
              </div>
              {percentageAfter < DEFAULT_THRESHOLD && (
                <p className="mt-2 text-center text-xs text-attendance-danger">
                  Below {DEFAULT_THRESHOLD}% threshold
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                              */
/* ------------------------------------------------------------------ */

interface AttendanceBadgeProps {
  value: number;
  threshold: number;
}

function AttendanceBadge({ value, threshold }: AttendanceBadgeProps) {
  const status =
    value >= threshold ? "safe" : value >= threshold - 5 ? "warning" : "danger";

  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums",
        status === "safe" && "badge-attendance-safe",
        status === "warning" && "badge-attendance-warning",
        status === "danger" && "badge-attendance-danger",
      )}
    >
      {value.toFixed(1)}%
    </span>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  const avg = Number.parseFloat(value);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span
          className={cn(
            "text-4xl font-bold tabular-nums",
            avg >= DEFAULT_THRESHOLD && "text-attendance-safe",
            avg < DEFAULT_THRESHOLD &&
              avg >= DEFAULT_THRESHOLD - 5 &&
              "text-attendance-warning",
            avg < DEFAULT_THRESHOLD - 5 && "text-attendance-danger",
          )}
        >
          {value}%
        </span>
      </CardContent>
    </Card>
  );
}

function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AttendanceEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <GraduationCap className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No attendance data</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Link your college account and sync to view attendance
        </p>
      </CardContent>
    </Card>
  );
}

function AttendanceError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Failed to load attendance</AlertTitle>
      <AlertDescription>
        Could not fetch attendance data. Please try again.
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
