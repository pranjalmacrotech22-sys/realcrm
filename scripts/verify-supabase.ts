import { createClient } from "@supabase/supabase-js";

const url = "https://wiiyyzfbqnlunahjofsi.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpaXl5emZicW5sdW5haGpvZnNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNzU0MDIsImV4cCI6MjEwNzk1MTQwMn0.CoasJ7e50iCK51IkCDBG8LsbC2LSFouJ4cBHDrEqRR8";

const supabase = createClient(url, anonKey);

async function checkAllTables() {
  const tables = [
    "organizations",
    "profiles",
    "memberships",
    "properties",
    "property_media",
    "customers",
    "requirements",
    "requirement_locations",
    "property_matches",
    "follow_ups",
    "activities",
  ];

  console.log("Checking all 11 tables on live Supabase instance...\n");

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`❌ Table '${table}':`, error.message, `(code: ${error.code})`);
    } else {
      console.log(`✅ Table '${table}': verified (count: ${count ?? 0})`);
    }
  }
}

checkAllTables();
