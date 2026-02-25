import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { AlertCircle, GraduationCap } from "lucide-react";
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
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Overall"
              value={
                attendance.length > 0
                  ? (
                      attendance.reduce((sum, r) => sum + r.percentage, 0) /
                      attendance.length
                    ).toFixed(1)
                  : "0.0"
              }
              attendance={attendance}
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
                  {attendance.filter((r) => r.percentage < r.threshold).length}
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
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={attendance.map((r) => ({
                    name: r.courseCode,
                    percentage: Math.round(r.percentage * 10) / 10,
                    threshold: r.threshold,
                  }))}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground font-mono"
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
                    {attendance.map((r) => (
                      <Cell
                        key={r.courseCode}
                        fill={
                          r.percentage >= r.threshold
                            ? "hsl(var(--chart-1))"
                            : r.percentage >= r.threshold - 5
                              ? "hsl(var(--chart-3))"
                              : "hsl(var(--chart-2))"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Attendance table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject-wise Breakdown</CardTitle>
              <CardDescription>
                Attendance details for each course
              </CardDescription>
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
                              <p className="text-xs text-muted-foreground">
                                {record.courseTitle}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.present}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {record.total}
                          </TableCell>
                          <TableCell className="text-right">
                            <AttendanceBadge
                              value={record.percentage}
                              threshold={record.threshold}
                            />
                          </TableCell>
                          {projections && (
                            <TableCell className="text-right">
                              {projection && (
                                <span className="text-xs text-muted-foreground">
                                  {projection.canSkip > 0
                                    ? `Can skip ${projection.canSkip}`
                                    : projection.mustAttend > 0
                                      ? `Need ${projection.mustAttend} more`
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
        </div>
      )}
    </div>
  );
}

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
  attendance: Array<{ percentage: number; threshold: number }>;
}

function SummaryCard({ label, value, attendance }: SummaryCardProps) {
  const avg = Number.parseFloat(value);
  const threshold = attendance[0]?.threshold ?? 75;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span
          className={cn(
            "text-4xl font-bold tabular-nums",
            avg >= threshold && "text-attendance-safe",
            avg < threshold &&
              avg >= threshold - 5 &&
              "text-attendance-warning",
            avg < threshold - 5 && "text-attendance-danger",
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
      <div className="grid gap-4 sm:grid-cols-3">
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
