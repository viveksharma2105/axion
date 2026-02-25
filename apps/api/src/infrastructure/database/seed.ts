import { db } from "./db";
import { colleges } from "./schema";

/**
 * Seed the colleges table with supported colleges.
 * Idempotent — uses ON CONFLICT DO NOTHING.
 */
async function seed() {
  console.log("Seeding colleges...");

  await db
    .insert(colleges)
    .values({
      slug: "ncu-india",
      name: "The NorthCap University",
      adapterId: "ncu-india",
      config: {},
      attendanceThreshold: "75.00",
      isActive: true,
    })
    .onConflictDoNothing({ target: colleges.slug });

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
