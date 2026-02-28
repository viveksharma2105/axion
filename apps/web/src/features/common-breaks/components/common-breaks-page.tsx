import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type CompareResult,
  type DayBreaks,
  type FriendTimetableEntry,
  useCommonBreaks,
} from "@/features/common-breaks/hooks/use-common-breaks";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Loader2,
  PartyPopper,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const SESSION_KEY = "axion:friend-creds";

/** If total common break time on a day exceeds 7h 30min, it's effectively a holiday */
const HOLIDAY_THRESHOLD_MINUTES = 450;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function loadSavedCredentials(): { username: string; password: string } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.username && parsed?.password) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { username: "", password: "" };
}

function saveCredentials(username: string, password: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, password }));
}

function clearCredentials() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function CommonBreaksPage() {
  const saved = loadSavedCredentials();
  const [username, setUsername] = useState(saved.username);
  const [password, setPassword] = useState(saved.password);
  const [autoFetched, setAutoFetched] = useState(false);
  const { mutate, data, isPending, error, reset } = useCommonBreaks();

  const result: CompareResult | null = data?.data ?? null;

  // Auto-fetch if we have saved credentials (once on mount)
  useEffect(() => {
    const creds = loadSavedCredentials();
    if (creds.username && creds.password && !autoFetched) {
      setAutoFetched(true);
      mutate({ username: creds.username, password: creds.password });
    }
  }, [mutate, autoFetched]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    saveCredentials(username.trim(), password.trim());
    mutate({ username: username.trim(), password: password.trim() });
  }

  function handleClear() {
    clearCredentials();
    setUsername("");
    setPassword("");
    reset();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Common Breaks
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Find common free time with a friend
        </p>
      </div>

      {/* Credentials form */}
      <Card>
        <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Friend&apos;s Credentials
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your friend&apos;s NCU portal credentials to compare
            timetables (8:30 AM &ndash; 4:20 PM, Mon&ndash;Sat)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="friend-username" className="text-xs sm:text-sm">
                  Username
                </Label>
                <Input
                  id="friend-username"
                  placeholder="e.g. 23CSU100"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isPending}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="friend-password" className="text-xs sm:text-sm">
                  Password
                </Label>
                <Input
                  id="friend-password"
                  type="password"
                  placeholder="NCU portal password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                className="flex-1 sm:flex-none"
                disabled={isPending || !username.trim() || !password.trim()}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">Find Breaks</span>
                    <span className="hidden sm:inline">Find Common Breaks</span>
                  </>
                )}
              </Button>
              {result && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            {error.message.includes("Invalid credentials")
              ? "Invalid credentials. Please check your friend's username and password."
              : error.message.includes("Rate")
                ? "Too many requests. Please wait a minute before trying again."
                : `Failed to compare timetables: ${error.message}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {result && (
        <>
          <CommonBreaksResults data={result.commonBreaks} />
          <FriendTimetableSection entries={result.friendTimetable} />
        </>
      )}
    </div>
  );
}

// ─── Common Breaks Results ───────────────────────────────────────────────────

interface CommonBreaksResultsProps {
  data: DayBreaks[];
}

function CommonBreaksResults({ data }: CommonBreaksResultsProps) {
  const totalBreaks = data.reduce((sum, d) => sum + d.breaks.length, 0);
  const totalMinutes = data.reduce(
    (sum, d) => sum + d.breaks.reduce((s, b) => s + b.durationMinutes, 0),
    0,
  );

  // Detect holiday days (total break time > 7h 30min means virtually no classes)
  const dayMinutes = (d: DayBreaks) =>
    d.breaks.reduce((s, b) => s + b.durationMinutes, 0);
  const isHoliday = (d: DayBreaks) => dayMinutes(d) > HOLIDAY_THRESHOLD_MINUTES;
  const holidays = data.filter(isHoliday);
  const nonHolidayBreaks = data.reduce(
    (sum, d) => sum + (isHoliday(d) ? 0 : d.breaks.length),
    0,
  );

  if (totalBreaks === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8">
          <Coffee className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
          <p className="mt-2 text-sm font-medium sm:mt-3">
            No common breaks found
          </p>
          <p className="text-xs text-muted-foreground">
            You and your friend have no overlapping free time during college
            hours
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          Common Free Slots
        </CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-1 sm:gap-2">
          <Badge variant="secondary" className="text-xs tabular-nums">
            {nonHolidayBreaks} break{nonHolidayBreaks !== 1 ? "s" : ""} this
            week
          </Badge>
          <Badge variant="outline" className="text-xs tabular-nums">
            {formatDuration(totalMinutes)} total free time
          </Badge>
          {holidays.length > 0 && (
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-xs tabular-nums"
            >
              {holidays.length} holiday{holidays.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue={String(data[0]?.dayOfWeek ?? 1)}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {data.map((d) => (
              <TabsTrigger
                key={d.dayOfWeek}
                value={String(d.dayOfWeek)}
                className={cn(
                  "min-h-10 px-2.5 text-xs sm:px-3 sm:text-sm",
                  d.breaks.length === 0 && "opacity-50",
                )}
              >
                <span>{d.dayName.slice(0, 3)}</span>
                {isHoliday(d) ? (
                  <PartyPopper className="ml-1 h-3.5 w-3.5 text-primary sm:ml-1.5 sm:h-4 sm:w-4" />
                ) : (
                  d.breaks.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 min-w-4 px-0.5 text-xs tabular-nums sm:ml-1.5 sm:h-5 sm:min-w-5 sm:px-1"
                    >
                      {d.breaks.length}
                    </Badge>
                  )
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {data.map((d) => (
            <TabsContent
              key={d.dayOfWeek}
              value={String(d.dayOfWeek)}
              className="mt-2 sm:mt-3"
            >
              {d.breaks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground sm:py-6 sm:text-sm">
                  No common breaks on {d.dayName}
                </p>
              ) : isHoliday(d) ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 py-6 text-center sm:py-8">
                  <PartyPopper className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                  <div>
                    <p className="text-sm font-medium sm:text-base">
                      It&apos;s a holiday!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.dayName} is entirely free &mdash;{" "}
                      <span className="tabular-nums">
                        {formatDuration(dayMinutes(d))}
                      </span>{" "}
                      of common break time
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {d.breaks.map((b) => (
                    <div
                      key={`${d.dayOfWeek}-${b.startTime}`}
                      className="flex items-center gap-2.5 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2.5 sm:gap-3 sm:p-3"
                    >
                      <div className="shrink-0 text-center">
                        <p className="text-xs font-semibold tabular-nums sm:text-sm">
                          {b.startTime}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {b.endTime}
                        </p>
                      </div>
                      <div className="h-7 w-px bg-primary/20 sm:h-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" />
                          <p className="text-xs font-medium sm:text-sm">
                            {formatDuration(b.durationMinutes)} free
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {b.startTime} &ndash; {b.endTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Friend Timetable Section ────────────────────────────────────────────────

interface FriendTimetableSectionProps {
  entries: FriendTimetableEntry[];
}

function FriendTimetableSection({ entries }: FriendTimetableSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const today = new Date().getDay();
  const defaultDay = today >= 1 && today <= 6 ? today : 1;

  // Deduplicate entries by dayOfWeek+startTime+courseCode for display count
  const uniqueEntries = deduplicateEntries(entries);

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              Friend&apos;s Timetable
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs sm:mt-1 sm:text-sm">
              {uniqueEntries.length} class
              {uniqueEntries.length !== 1 ? "es" : ""} across the week
            </CardDescription>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent sm:h-9 sm:w-9">
            {expanded ? (
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue={String(defaultDay)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                const count = getUniqueDayEntries(uniqueEntries, dayNum).length;
                return (
                  <TabsTrigger
                    key={dayNum}
                    value={String(dayNum)}
                    className={cn(
                      "min-h-10 px-2.5 text-xs sm:px-3 sm:text-sm",
                      count === 0 && "opacity-50",
                    )}
                  >
                    <span>{DAYS[dayNum]?.slice(0, 3)}</span>
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-4 min-w-4 px-0.5 text-xs tabular-nums sm:ml-1.5 sm:h-5 sm:min-w-5 sm:px-1"
                      >
                        {count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {[1, 2, 3, 4, 5, 6].map((dayNum) => {
              const dayEntries = getUniqueDayEntries(uniqueEntries, dayNum);

              return (
                <TabsContent
                  key={dayNum}
                  value={String(dayNum)}
                  className="mt-2 sm:mt-3"
                >
                  {dayEntries.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground sm:py-6 sm:text-sm">
                      No classes on {DAYS[dayNum]}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <FriendScheduleItem
                          key={`${entry.dayOfWeek}-${entry.startTime}-${entry.courseCode}`}
                          entry={entry}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}

interface FriendScheduleItemProps {
  entry: FriendTimetableEntry;
}

function FriendScheduleItem({ entry }: FriendScheduleItemProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border p-2.5 sm:gap-4 sm:p-3">
      <div className="shrink-0 text-center">
        <p className="text-xs font-semibold tabular-nums sm:text-sm">
          {entry.startTime}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {entry.endTime}
        </p>
      </div>
      <div className="h-8 w-px bg-border sm:h-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium sm:text-sm">
          {entry.courseName || "Unknown Course"}
        </p>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground sm:gap-x-2">
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
              <span className="hidden sm:inline">&middot;</span>
              <span className="hidden sm:inline">{entry.facultyName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Deduplicate timetable entries that share the same dayOfWeek + startTime + courseCode */
function deduplicateEntries(
  entries: FriendTimetableEntry[],
): FriendTimetableEntry[] {
  const seen = new Set<string>();
  const unique: FriendTimetableEntry[] = [];
  for (const e of entries) {
    const key = `${e.dayOfWeek}-${e.startTime}-${e.courseCode}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(e);
    }
  }
  return unique;
}

/** Get unique entries for a specific day, sorted by start time */
function getUniqueDayEntries(
  entries: FriendTimetableEntry[],
  dayOfWeek: number,
): FriendTimetableEntry[] {
  return entries
    .filter((e) => e.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
