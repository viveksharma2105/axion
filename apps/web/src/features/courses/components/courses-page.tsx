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
import { useCourses } from "@/features/courses/hooks/use-courses";
import { AlertCircle, BookOpen } from "lucide-react";

export function CoursesPage() {
  const { data: courses, isLoading, error, refetch } = useCourses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Your registered courses this semester
        </p>
      </div>

      {isLoading ? (
        <CoursesSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load courses</AlertTitle>
          <AlertDescription>
            Could not fetch course data.
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
      ) : !courses || courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No courses found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Link your college account and sync to view your courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Registered Courses</CardTitle>
              <Badge variant="outline">
                {courses.length} course{courses.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <CardDescription>
              Total credits:{" "}
              <span className="tabular-nums">
                {courses.reduce((sum, c) => sum + c.credits, 0).toFixed(1)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-md border sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right tabular-nums">
                      Credits
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.courseCode}>
                      <TableCell className="font-mono text-sm">
                        {course.courseCode}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {course.courseTitle}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {course.courseType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {course.credits.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
              {courses.map((course) => (
                <div key={course.courseCode} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-sm">
                        {course.courseCode}
                      </span>
                      <p className="truncate text-sm text-muted-foreground">
                        {course.courseTitle}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {course.credits.toFixed(1)} cr
                    </span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {course.courseType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
