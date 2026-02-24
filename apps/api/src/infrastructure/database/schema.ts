import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Better Auth Core Tables ──────────────────────────────────────────────────
// These tables are required by Better Auth. We define them here so the schema
// is co-located and the Drizzle adapter can reference them.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Axion Tables ─────────────────────────────────────────────────────────────

export const colleges = pgTable("colleges", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  adapterId: varchar("adapter_id", { length: 50 }).notNull(),
  config: jsonb("config").notNull().default({}),
  attendanceThreshold: decimal("attendance_threshold", {
    precision: 5,
    scale: 2,
  }).default("75.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  pushSubscription: jsonb("push_subscription"),
  notificationPrefs: jsonb("notification_prefs").default({
    push: true,
    inApp: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const collegeLinks = pgTable(
  "college_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id),
    encryptedUsername: text("encrypted_username").notNull(),
    encryptedPassword: text("encrypted_password").notNull(),
    encryptionIv: text("encryption_iv").notNull(),
    encryptionAuthTag: text("encryption_auth_tag").notNull(),
    collegeUserId: text("college_user_id"),
    collegeToken: text("college_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    syncStatus: varchar("sync_status", { length: 20 })
      .notNull()
      .default("pending"),
    syncError: text("sync_error"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("college_links_user_college_unique").on(
      table.userId,
      table.collegeId,
    ),
    index("idx_college_links_user").on(table.userId),
    index("idx_college_links_sync").on(table.syncStatus, table.lastSyncAt),
  ],
);

export const attendances = pgTable(
  "attendances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collegeLinkId: uuid("college_link_id")
      .notNull()
      .references(() => collegeLinks.id, { onDelete: "cascade" }),
    courseCode: varchar("course_code", { length: 50 }).notNull(),
    courseName: varchar("course_name", { length: 255 }),
    totalLectures: integer("total_lectures").notNull().default(0),
    totalPresent: integer("total_present").notNull().default(0),
    totalAbsent: integer("total_absent").notNull().default(0),
    totalLoa: integer("total_loa").notNull().default(0),
    totalOnDuty: integer("total_on_duty").notNull().default(0),
    percentage: decimal("percentage", { precision: 5, scale: 2 }),
    rawData: jsonb("raw_data"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("attendances_link_course_synced_unique").on(
      table.collegeLinkId,
      table.courseCode,
      table.syncedAt,
    ),
    index("idx_attendances_link").on(table.collegeLinkId, table.syncedAt),
    index("idx_attendances_latest").on(
      table.collegeLinkId,
      table.courseCode,
      table.syncedAt,
    ),
  ],
);

export const timetables = pgTable(
  "timetables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collegeLinkId: uuid("college_link_id")
      .notNull()
      .references(() => collegeLinks.id, { onDelete: "cascade" }),
    dayOfWeek: smallint("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    courseCode: varchar("course_code", { length: 50 }),
    courseName: varchar("course_name", { length: 255 }),
    facultyName: varchar("faculty_name", { length: 255 }),
    room: varchar("room", { length: 100 }),
    section: varchar("section", { length: 50 }),
    rawData: jsonb("raw_data"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_timetables_link").on(table.collegeLinkId, table.dayOfWeek),
  ],
);

export const marks = pgTable(
  "marks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collegeLinkId: uuid("college_link_id")
      .notNull()
      .references(() => collegeLinks.id, { onDelete: "cascade" }),
    courseCode: varchar("course_code", { length: 50 }).notNull(),
    courseName: varchar("course_name", { length: 255 }),
    examType: varchar("exam_type", { length: 100 }),
    maxMarks: decimal("max_marks", { precision: 6, scale: 2 }),
    obtainedMarks: decimal("obtained_marks", { precision: 6, scale: 2 }),
    grade: varchar("grade", { length: 5 }),
    sgpa: decimal("sgpa", { precision: 4, scale: 2 }),
    cgpa: decimal("cgpa", { precision: 4, scale: 2 }),
    semester: varchar("semester", { length: 20 }),
    rawData: jsonb("raw_data"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_marks_link").on(table.collegeLinkId, table.courseCode),
  ],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collegeLinkId: uuid("college_link_id")
      .notNull()
      .references(() => collegeLinks.id, { onDelete: "cascade" }),
    courseCode: varchar("course_code", { length: 50 }).notNull(),
    courseName: varchar("course_name", { length: 255 }).notNull(),
    credits: decimal("credits", { precision: 3, scale: 1 }),
    facultyName: varchar("faculty_name", { length: 255 }),
    section: varchar("section", { length: 50 }),
    semester: varchar("semester", { length: 20 }),
    rawData: jsonb("raw_data"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_courses_link").on(table.collegeLinkId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    metadata: jsonb("metadata"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_notifications_user").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
  ],
);

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collegeLinkId: uuid("college_link_id")
      .notNull()
      .references(() => collegeLinks.id, { onDelete: "cascade" }),
    syncType: varchar("sync_type", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_sync_logs_link").on(table.collegeLinkId, table.startedAt),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(userProfiles, {
    fields: [user.id],
    references: [userProfiles.userId],
  }),
  collegeLinks: many(collegeLinks),
  notifications: many(notifications),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userProfileRelations = relations(userProfiles, ({ one }) => ({
  user: one(user, {
    fields: [userProfiles.userId],
    references: [user.id],
  }),
}));

export const collegeRelations = relations(colleges, ({ many }) => ({
  collegeLinks: many(collegeLinks),
}));

export const collegeLinkRelations = relations(
  collegeLinks,
  ({ one, many }) => ({
    user: one(user, {
      fields: [collegeLinks.userId],
      references: [user.id],
    }),
    college: one(colleges, {
      fields: [collegeLinks.collegeId],
      references: [colleges.id],
    }),
    attendances: many(attendances),
    timetables: many(timetables),
    marks: many(marks),
    courses: many(courses),
    syncLogs: many(syncLogs),
  }),
);

export const attendanceRelations = relations(attendances, ({ one }) => ({
  collegeLink: one(collegeLinks, {
    fields: [attendances.collegeLinkId],
    references: [collegeLinks.id],
  }),
}));

export const timetableRelations = relations(timetables, ({ one }) => ({
  collegeLink: one(collegeLinks, {
    fields: [timetables.collegeLinkId],
    references: [collegeLinks.id],
  }),
}));

export const markRelations = relations(marks, ({ one }) => ({
  collegeLink: one(collegeLinks, {
    fields: [marks.collegeLinkId],
    references: [collegeLinks.id],
  }),
}));

export const courseRelations = relations(courses, ({ one }) => ({
  collegeLink: one(collegeLinks, {
    fields: [courses.collegeLinkId],
    references: [collegeLinks.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

export const syncLogRelations = relations(syncLogs, ({ one }) => ({
  collegeLink: one(collegeLinks, {
    fields: [syncLogs.collegeLinkId],
    references: [collegeLinks.id],
  }),
}));
