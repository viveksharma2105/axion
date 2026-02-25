import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMarks, useMarksSummary } from "@/features/marks/hooks/use-marks";
import { AlertCircle, BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MarksPage() {
  const { data: marks, isLoading, error, refetch } = useMarks();
  const { data: summary } = useMarksSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marks</h1>
        <p className="text-muted-foreground">
          Your academic performance and GPA summary
        </p>
      </div>

      {isLoading ? (
        <MarksSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load marks</AlertTitle>
          <AlertDescription>
            Could not fetch marks data.
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : !marks || marks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No marks data</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Link your college account and sync to view your marks
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* GPA summary */}
          {summary && summary.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map((s) => (
                <Card key={s.semester}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Semester {s.semester}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">
                        {s.sgpa.toFixed(2)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        SGPA
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      CGPA: {s.cgpa.toFixed(2)} &middot; {s.creditsEarned}/
                      {s.totalCredits} credits
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* GPA trend chart */}
          {summary && summary.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">GPA Trend</CardTitle>
                <CardDescription>
                  SGPA and CGPA progression across semesters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary.map((s) => ({
                        name: `Sem ${s.semester}`,
                        sgpa: s.sgpa,
                        cgpa: s.cgpa,
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
          )}

          {/* Marks table — desktop */}
          <Card className="hidden sm:block">
            <CardHeader>
              <CardTitle className="text-lg">Detailed Marks</CardTitle>
              <CardDescription>
                Subject-wise marks for all exams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Exam</TableHead>
                      <TableHead className="text-right tabular-nums">
                        Marks
                      </TableHead>
                      <TableHead className="text-right tabular-nums">
                        Sem
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marks.map((record, i) => (
                      <TableRow
                        key={`${record.courseCode}-${record.examType}-${i}`}
                      >
                        <TableCell>
                          <div>
                            <span className="font-mono text-sm">
                              {record.courseCode}
                            </span>
                            <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                              {record.courseTitle}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{record.examType}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {record.marksObtained}/{record.maxMarks}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {record.semester}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Marks cards — mobile */}
          <div className="space-y-3 sm:hidden">
            <h2 className="text-lg font-semibold tracking-tight">
              Detailed Marks
            </h2>
            {marks.map((record, i) => (
              <Card key={`${record.courseCode}-${record.examType}-${i}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-sm">
                        {record.courseCode}
                      </span>
                      <p className="truncate text-xs text-muted-foreground">
                        {record.courseTitle}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      Sem {record.semester}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {record.examType}
                    </span>
                    <span className="font-medium tabular-nums">
                      {record.marksObtained}/{record.maxMarks}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MarksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-52" />
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
