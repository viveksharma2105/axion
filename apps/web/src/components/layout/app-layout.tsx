import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  GraduationCap,
  Home,
  Menu,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

const primaryNavItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/attendance", icon: GraduationCap, label: "Attendance" },
  { to: "/timetable", icon: Calendar, label: "Schedule" },
  { to: "/marks", icon: BarChart3, label: "Marks" },
] as const;

const moreNavItems = [
  { to: "/courses", icon: BookOpen, label: "Courses" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

const allNavItems = [...primaryNavItems, ...moreNavItems] as const;

const secondaryNavItems = [
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <DesktopSidebar />

        {/* Main content */}
        <main className="flex-1 pb-16 lg:pb-0">
          {/* Mobile header */}
          <MobileHeader />

          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </TooltipProvider>
  );
}

function DesktopSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const desktopPrimaryItems = [
    ...primaryNavItems,
    { to: "/courses", icon: BookOpen, label: "Courses" },
  ] as const;

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-6">
          <GraduationCap className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            Axion
          </span>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Primary nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {desktopPrimaryItems.map((item) => (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    currentPath === item.to
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Secondary nav */}
        <div className="space-y-1 px-3 pb-4">
          <Separator className="mb-4 bg-sidebar-border" />
          {secondaryNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                currentPath === item.to
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* User */}
        {session?.user && (
          <div className="border-t border-sidebar-border px-3 py-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
                  {session.user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {session.user.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-base font-bold tracking-tight">Axion</span>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/notifications">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
        </Link>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-1">
              {allNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    currentPath === item.to
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {session?.user && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="flex items-center gap-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {session.user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">
                      {session.user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreNavItems.some((item) => currentPath === item.to);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-center justify-around">
        {primaryNavItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
              currentPath === item.to
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs leading-none">{item.label}</span>
          </Link>
        ))}

        {/* More button opens sheet with remaining items */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="More"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs leading-none">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 space-y-1 pb-4">
              {moreNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    currentPath === item.to
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
