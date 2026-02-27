ALTER TABLE "user_profiles" ADD COLUMN "roll_no" varchar(50);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "student_name" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "semester" smallint;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "programme_name" varchar(500);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "degree_level" varchar(20);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "father_name" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "mobile_no" varchar(20);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "section" varchar(50);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "student_image" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "college_link_id" uuid;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_college_link_id_college_links_id_fk" FOREIGN KEY ("college_link_id") REFERENCES "public"."college_links"("id") ON DELETE set null ON UPDATE no action;