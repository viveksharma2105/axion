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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { signOut } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import { useThemeStore } from "@/stores/use-theme-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface College {
  id: string;
  name: string;
  slug: string;
}

interface CollegeLink {
  id: string;
  collegeSlug: string;
  syncStatus: string;
  lastSyncAt: string | null;
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your college links, preferences, and account
        </p>
      </div>

      <CollegeLinkSection />
      <Separator />
      <ThemeSection />
      <Separator />
      <AccountSection />
    </div>
  );
}

function CollegeLinkSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { data: links, isLoading: linksLoading } = useQuery({
    queryKey: queryKeys.collegeLinks.all,
    queryFn: () => api.get<CollegeLink[]>("/college-links"),
    select: (data) => data.data,
  });

  const { data: colleges } = useQuery({
    queryKey: queryKeys.colleges.all,
    queryFn: () => api.get<College[]>("/colleges"),
    select: (data) => data.data,
  });

  const linkMutation = useMutation({
    mutationFn: (data: {
      collegeSlug: string;
      username: string;
      password: string;
    }) => api.post("/college-links", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collegeLinks.all });
      setOpen(false);
      setUsername("");
      setPassword("");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/college-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collegeLinks.all });
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.post(`/college-links/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.collegeLinks.all });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">College Links</CardTitle>
            <CardDescription>
              Connect your college portal to sync data
            </CardDescription>
          </div>
          {/* Sheet for mobile-friendly "Link College" form */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Link College
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl sm:hidden">
              <SheetHeader>
                <SheetTitle>Link College Account</SheetTitle>
                <SheetDescription>
                  Enter your college portal credentials. They are encrypted
                  before storage.
                </SheetDescription>
              </SheetHeader>
              <LinkCollegeForm
                username={username}
                password={password}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onSubmit={() => {
                  const college = colleges?.[0];
                  if (!college) return;
                  linkMutation.mutate({
                    collegeSlug: college.slug,
                    username,
                    password,
                  });
                }}
                isPending={linkMutation.isPending}
                error={linkMutation.error}
              />
            </SheetContent>
            {/* Dialog-style sheet for desktop */}
            <SheetContent side="right" className="hidden w-[400px] sm:block">
              <SheetHeader>
                <SheetTitle>Link College Account</SheetTitle>
                <SheetDescription>
                  Enter your college portal credentials. They are encrypted
                  before storage.
                </SheetDescription>
              </SheetHeader>
              <LinkCollegeForm
                username={username}
                password={password}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onSubmit={() => {
                  const college = colleges?.[0];
                  if (!college) return;
                  linkMutation.mutate({
                    collegeSlug: college.slug,
                    username,
                    password,
                  });
                }}
                isPending={linkMutation.isPending}
                error={linkMutation.error}
              />
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>
      <CardContent>
        {linksLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !links || links.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No colleges linked yet. Click "Link College" to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const college = colleges?.find(
                (c) => c.slug === link.collegeSlug,
              );
              return (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {college?.name ?? link.collegeSlug}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Status: {link.syncStatus}
                      {link.lastSyncAt &&
                        ` · Last synced: ${new Date(link.lastSyncAt).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate(link.id)}
                      disabled={syncMutation.isPending}
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => unlinkMutation.mutate(link.id)}
                      disabled={unlinkMutation.isPending}
                      aria-label="Unlink college"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LinkCollegeFormProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error: Error | null;
}

function LinkCollegeForm({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  isPending,
  error,
}: LinkCollegeFormProps) {
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="username">College Username</Label>
        <Input
          id="username"
          placeholder="e.g., 23CSU337"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Your college portal login ID
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">College Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Link Account
      </Button>
    </form>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useThemeStore();

  const options = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Appearance</CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant={theme === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(opt.value)}
              className="w-full gap-2"
            >
              <opt.icon className="h-4 w-4" />
              {opt.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Account</CardTitle>
        <CardDescription>Manage your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={() =>
            signOut({
              fetchOptions: { onSuccess: () => window.location.reload() },
            })
          }
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
