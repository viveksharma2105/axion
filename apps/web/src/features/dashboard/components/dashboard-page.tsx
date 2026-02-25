import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calendar,
  GraduationCap,
  LinkIcon,
} from "lucide-react";

interface CollegeLink {
  id: string;
  collegeSlug: string;
  syncStatus: string;
  lastSyncedAt: string | null;
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
          Welcome back. Here's an overview of your academics.
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
  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickStatCard
          title="Attendance"
          icon={GraduationCap}
          linkTo="/attendance"
          linkLabel="View details"
        />
        <QuickStatCard
          title="Today's Classes"
          icon={Calendar}
          linkTo="/timetable"
          linkLabel="View schedule"
        />
        <QuickStatCard
          title="Marks"
          icon={BarChart3}
          linkTo="/marks"
          linkLabel="View marks"
        />
        <QuickStatCard
          title="Courses"
          icon={BookOpen}
          linkTo="/courses"
          linkLabel="View courses"
        />
      </div>
    </div>
  );
}

interface QuickStatCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  linkTo: string;
  linkLabel: string;
}

function QuickStatCard({
  title,
  icon: Icon,
  linkTo,
  linkLabel,
}: QuickStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-20" />
        <Link to={linkTo}>
          <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {linkLabel} &rarr;
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
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
  );
}
