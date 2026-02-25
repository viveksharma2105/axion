import { AppLayout } from "@/components/layout/app-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  Outlet,
  createFileRoute,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data?.session) {
      throw redirect({ to: "/login" });
    }
    return { user: session.data.user };
  },
  component: AuthenticatedLayout,
  pendingComponent: AuthenticatedPending,
  errorComponent: AuthenticatedError,
});

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function AuthenticatedPending() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function AuthenticatedError({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <AppLayout>
      <div className="flex items-center justify-center py-12">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            <p className="mt-1 text-sm">
              {error.message || "An unexpected error occurred."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.invalidate()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </AppLayout>
  );
}
