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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useTimetable,
  useTodaySchedule,
} from "@/features/timetable/hooks/use-timetable";
import { AlertCircle, Calendar } from "lucide-react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function TimetablePage() {
  const { data: timetable, isLoading, error, refetch } = useTimetable();
  const { data: todaySchedule } = useTodaySchedule();

  const today = new Date().getDay();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground">Your weekly class schedule</p>
      </div>

      {isLoading ? (
        <TimetableSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load timetable</AlertTitle>
          <AlertDescription>
            Could not fetch schedule data.
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
      ) : !timetable || timetable.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              No schedule data
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Link your college account and sync to view your timetable
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Today's schedule */}
          {todaySchedule && todaySchedule.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Today's Schedule</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </Badge>
                </div>
                <CardDescription>
                  {todaySchedule.length} class
                  {todaySchedule.length !== 1 ? "es" : ""} today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaySchedule.map((entry) => (
                    <ScheduleItem key={entry.id} entry={entry} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weekly view */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly View</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={String(today === 0 ? 1 : today)}>
                <TabsList className="w-full justify-start overflow-x-auto">
                  {DAYS.slice(1, 6).map((day, i) => (
                    <TabsTrigger
                      key={day}
                      value={String(i + 1)}
                      className="min-h-10"
                    >
                      {day.slice(0, 3)}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger value="6" className="min-h-10">
                    Sat
                  </TabsTrigger>
                </TabsList>
                {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                  const dayEntries = timetable.filter(
                    (e) => e.dayOfWeek === dayNum,
                  );
                  return (
                    <TabsContent key={dayNum} value={String(dayNum)}>
                      {dayEntries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No classes on {DAYS[dayNum]}
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {dayEntries
                            .sort((a, b) =>
                              a.startTime.localeCompare(b.startTime),
                            )
                            .map((entry) => (
                              <ScheduleItem key={entry.id} entry={entry} />
                            ))}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface ScheduleItemProps {
  entry: {
    id: string;
    courseCode: string | null;
    courseName: string | null;
    startTime: string;
    endTime: string;
    room: string | null;
    facultyName: string | null;
  };
}

function ScheduleItem({ entry }: ScheduleItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="shrink-0 text-center">
        <p className="text-sm font-semibold tabular-nums">{entry.startTime}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {entry.endTime}
        </p>
      </div>
      <div className="h-10 w-px bg-border" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {entry.courseName ?? "Unknown Course"}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.courseCode && (
            <span className="font-mono">{entry.courseCode}</span>
          )}
          {entry.room && (
            <>
              <span>&middot;</span>
              <span>{entry.room}</span>
            </>
          )}
          {entry.facultyName && (
            <>
              <span>&middot;</span>
              <span>{entry.facultyName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TimetableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
