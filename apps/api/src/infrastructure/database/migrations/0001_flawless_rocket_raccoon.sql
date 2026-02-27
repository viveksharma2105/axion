ALTER TABLE "timetables" ADD COLUMN "lecture_date" varchar(10);--> statement-breakpoint
CREATE INDEX "idx_timetables_link_date" ON "timetables" USING btree ("college_link_id","lecture_date");