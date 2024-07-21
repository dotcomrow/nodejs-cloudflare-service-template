export async function init_script(env) {
  const db = drizzle(env.cache);
  try {
    var res = await db
      .select()
      .from(cache)
      .where(eq(cache.account_id, profile.id));
  } catch (error) {
    await env.user_prefs_database
      .prepare(
        `CREATE TABLE cache (
      account_id varchar(64) PRIMARY KEY,
      response jsonb,
      last_update_datetime timestamp)`
      )
      .run();
  }
  return "initialization complete";
}
