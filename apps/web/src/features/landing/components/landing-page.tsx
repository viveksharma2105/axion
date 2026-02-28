import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { signIn } from "@/lib/auth-client";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";
import { useState } from "react";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Google SVG Icon                                                          */
/* ────────────────────────────────────────────────────────────────────────── */
interface GoogleIconProps {
  className?: string;
}

function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Feature data                                                             */
/* ────────────────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: BarChart3,
    title: "Attendance Tracking",
    description:
      "Subject-wise attendance with trend charts, projected percentages, and classes-needed calculator.",
  },
  {
    icon: Calendar,
    title: "Smart Timetable",
    description:
      "Daily and weekly schedule with current class highlighting and room information.",
  },
  {
    icon: BookOpen,
    title: "Marks & Grades",
    description:
      "Internal marks, semester results, SGPA/CGPA tracking with subject-wise breakdowns.",
  },
  {
    icon: Bell,
    title: "Proactive Alerts",
    description:
      "Get notified when attendance drops, new marks are posted, or your timetable changes.",
  },
  {
    icon: RefreshCw,
    title: "Auto Sync",
    description:
      "Data syncs automatically twice daily. Trigger a manual sync whenever you need fresh data.",
  },
  {
    icon: Smartphone,
    title: "Installable PWA",
    description:
      "Add to your home screen for an app-like experience. Works offline with cached data.",
  },
];

const steps = [
  {
    step: "01",
    title: "Sign in with Google",
    description:
      "Create your Axion account in one click. No new passwords to remember.",
  },
  {
    step: "02",
    title: "Link your college",
    description:
      "Enter your college portal credentials. They're encrypted with AES-256-GCM and never stored in plain text.",
  },
  {
    step: "03",
    title: "Everything, unified",
    description:
      "Attendance, timetable, marks, and courses — all in one fast, modern interface.",
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Landing Page                                                             */
/* ────────────────────────────────────────────────────────────────────────── */
export function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/login" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Axion</span>
          </Link>
          <Button size="sm" onClick={handleGoogleSignIn} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Get Started
          </Button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle radial gradient for visual depth */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="secondary"
              className="mb-6 px-3 py-1 text-xs font-medium"
            >
              <Zap className="mr-1.5 h-3 w-3" />
              Now supporting NCU India
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your college portal,{" "}
              <span className="text-muted-foreground">reimagined</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Stop wrestling with slow, outdated college systems. Axion unifies
              your attendance, timetable, marks, and courses into one fast,
              modern interface.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                asChild
              >
                <a href="#features">
                  See what's inside
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Free for students. No credit card required.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Problem Statement ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your college portal is broken
          </h2>
          <p className="mt-4 text-muted-foreground">
            Most college portals are painfully slow, crash during peak hours,
            and look like they were built a decade ago. You check attendance and
            timetable multiple times a day — you deserve better.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Slow & Unreliable",
              detail: "Pages take forever to load. Servers crash during exams.",
            },
            {
              label: "Terrible UX",
              detail: "Outdated interfaces that aren't designed for mobile.",
            },
            {
              label: "No Alerts",
              detail:
                "You find out your attendance dropped only when it's too late.",
            },
          ].map((problem) => (
            <Card key={problem.label} className="border-destructive/20">
              <CardContent className="p-5">
                <p className="font-semibold text-destructive">
                  {problem.label}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {problem.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Features ────────────────────────────────────────────────── */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need, nothing you don't
          </h2>
          <p className="mt-4 text-muted-foreground">
            Axion proxies your college's data and presents it through a fast,
            clean, mobile-first experience.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group transition-colors duration-200 hover:border-primary/30"
            >
              <CardContent className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-200 group-hover:bg-primary/15">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Up and running in 2 minutes
          </h2>
          <p className="mt-4 text-muted-foreground">
            No complicated setup. No app to download. Just sign in and link your
            college.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.step} className="relative">
              <span className="text-5xl font-bold tabular-nums text-muted-foreground/20">
                {step.step}
              </span>
              <h3 className="mt-3 font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Trust / Security ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your data, protected
          </h2>
          <p className="mt-4 text-muted-foreground">
            We take security seriously. Your college credentials are encrypted
            and your data stays private.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Lock,
              title: "AES-256-GCM Encryption",
              description:
                "College credentials are encrypted with military-grade encryption before storage. Never in plain text.",
            },
            {
              icon: Shield,
              title: "Secure Sessions",
              description:
                "HTTP-only cookies, strict CORS, and rate limiting protect every request.",
            },
            {
              icon: CheckCircle2,
              title: "Your Data, Your Control",
              description:
                "Unlink your college account at any time. Your encrypted credentials are deleted immediately.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-lg border border-border p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to ditch the old portal?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join students who already use Axion for a faster, smarter college
            experience.
          </p>
          <Button
            size="lg"
            className="mt-8"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Get started for free
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Axion</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for students, by students. Not affiliated with any college.
          </p>
        </div>
      </footer>
    </div>
  );
}
