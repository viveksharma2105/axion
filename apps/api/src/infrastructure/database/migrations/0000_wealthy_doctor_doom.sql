CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_link_id" uuid NOT NULL,
	"course_code" varchar(50) NOT NULL,
	"course_name" varchar(255),
	"total_lectures" integer DEFAULT 0 NOT NULL,
	"total_present" integer DEFAULT 0 NOT NULL,
	"total_absent" integer DEFAULT 0 NOT NULL,
	"total_loa" integer DEFAULT 0 NOT NULL,
	"total_on_duty" integer DEFAULT 0 NOT NULL,
	"percentage" numeric(5, 2),
	"raw_data" jsonb,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendances_link_course_synced_unique" UNIQUE("college_link_id","course_code","synced_at")
);
--> statement-breakpoint
CREATE TABLE "college_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"college_id" uuid NOT NULL,
	"encrypted_username" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"encryption_iv" text NOT NULL,
	"encryption_auth_tag" text NOT NULL,
	"college_user_id" text,
	"college_token" text,
	"token_expires_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"sync_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sync_error" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "college_links_user_college_unique" UNIQUE("user_id","college_id")
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"adapter_id" varchar(50) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attendance_threshold" numeric(5, 2) DEFAULT '75.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_link_id" uuid NOT NULL,
	"course_code" varchar(50) NOT NULL,
	"course_name" varchar(255) NOT NULL,
	"credits" numeric(3, 1),
	"faculty_name" varchar(255),
	"section" varchar(50),
	"semester" varchar(20),
	"raw_data" jsonb,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_link_id" uuid NOT NULL,
	"course_code" varchar(50) NOT NULL,
	"course_name" varchar(255),
	"exam_type" varchar(100),
	"max_marks" numeric(6, 2),
	"obtained_marks" numeric(6, 2),
	"grade" varchar(5),
	"sgpa" numeric(4, 2),
	"cgpa" numeric(4, 2),
	"semester" varchar(20),
	"raw_data" jsonb,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_link_id" uuid NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "timetables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_link_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"course_code" varchar(50),
	"course_name" varchar(255),
	"faculty_name" varchar(255),
	"room" varchar(100),
	"section" varchar(50),
	"raw_data" jsonb,
	"synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" varchar(100),
	"avatar_url" text,
	"push_subscription" jsonb,
	"notification_prefs" jsonb DEFAULT '{"push":true,"inApp":true}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_college_link_id_college_links_id_fk" FOREIGN KEY ("college_link_id") REFERENCES "public"."college_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_links" ADD CONSTRAINT "college_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_links" ADD CONSTRAINT "college_links_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_college_link_id_college_links_id_fk" FOREIGN KEY ("college_link_id") REFERENCES "public"."college_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marks" ADD CONSTRAINT "marks_college_link_id_college_links_id_fk" FOREIGN KEY ("college_link_id") REFERENCES "public"."college_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_college_link_id_college_links_id_fk" FOREIGN KEY ("college_link_id") REFERENCES "public"."college_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_college_link_id_college_links_id_fk" FOREIGN KEY ("college_link_id") REFERENCES "public"."college_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attendances_link" ON "attendances" USING btree ("college_link_id","synced_at");--> statement-breakpoint
CREATE INDEX "idx_attendances_latest" ON "attendances" USING btree ("college_link_id","course_code","synced_at");--> statement-breakpoint
CREATE INDEX "idx_college_links_user" ON "college_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_college_links_sync" ON "college_links" USING btree ("sync_status","last_sync_at");--> statement-breakpoint
CREATE INDEX "idx_courses_link" ON "courses" USING btree ("college_link_id");--> statement-breakpoint
CREATE INDEX "idx_marks_link" ON "marks" USING btree ("college_link_id","course_code");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_sync_logs_link" ON "sync_logs" USING btree ("college_link_id","started_at");--> statement-breakpoint
CREATE INDEX "idx_timetables_link" ON "timetables" USING btree ("college_link_id","day_of_week");