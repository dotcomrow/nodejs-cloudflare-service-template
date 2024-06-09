import { sqliteTable } from "drizzle-orm/sqlite-core";
import { jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

export const user_preferences = sqliteTable("user_preferences", {
    account_id: varchar("account_id").notNull().primaryKey(),
    preferences: jsonb("preferences").notNull(),
    last_update_datetime: timestamp("last_update_datetime").notNull(),
  });
  
export async function dbSetup(env, account_id) {
  
    const db = drizzle(env.user_prefs_database);
    try {
      await db
        .select()
        .from(user_preferences)
        .where(eq(user_preferences.account_id, account_id));
    } catch (error) {
      await env.user_prefs_database
        .prepare(
          `CREATE TABLE user_preferences (
        account_id varchar(64) PRIMARY KEY,
        preferences jsonb,
        last_update_datetime timestamp)`
        )
        .run();
    }
}