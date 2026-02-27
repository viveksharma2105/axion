export const queryKeys = {
  colleges: {
    all: ["colleges"] as const,
  },
  collegeLinks: {
    all: ["college-links"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    summary: () => [...queryKeys.attendance.all, "summary"] as const,
    history: (courseCode?: string) =>
      [...queryKeys.attendance.all, "history", courseCode] as const,
    projection: () => [...queryKeys.attendance.all, "projection"] as const,
  },
  timetable: {
    all: ["timetable"] as const,
    full: () => [...queryKeys.timetable.all, "full"] as const,
    today: () => [...queryKeys.timetable.all, "today"] as const,
  },
  marks: {
    all: ["marks"] as const,
    list: (semester?: number, examType?: string) =>
      [...queryKeys.marks.all, "list", semester, examType] as const,
    summary: () => [...queryKeys.marks.all, "summary"] as const,
  },
  courses: {
    all: ["courses"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (page?: number) =>
      [...queryKeys.notifications.all, "list", page] as const,
  },
  profile: {
    all: ["profile"] as const,
  },
} as const;
