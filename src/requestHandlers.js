import { sqliteTable } from "drizzle-orm/sqlite-core";
import { jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";

const user_preferences = sqliteTable("user_preferences", {
  account_id: varchar("account_id").notNull().primaryKey(),
  preferences: jsonb("preferences").notNull(),
  last_update_datetime: timestamp("last_update_datetime").notNull(),
});

export async function handleGet(env, account_id, id_token) {
  var returnObject = {};
  if (id_token) {
    var backendResp = await fetch(env.USER_PROFILE_SVC_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + id_token,
      },
    });
    var backendRespJson = JSON.parse(await backendResp.text());
    returnObject["groups"] = backendRespJson["groups"];
  }

  const db = drizzle(env.user_prefs_database);
  var res = await env.user_prefs_database.prepare(
    "select * from user_preferences where account_id = ?"
  )
    .bind(account_id)
    .all();
  if (res.results.length == 0) {
    await db
      .insert(user_preferences)
      .values({
        account_id: account_id,
        preferences: {},
        last_update_datetime: new Date(),
      })
      .run();
      var res = await env.user_prefs_database.prepare(
        "select * from user_preferences where account_id = ?"
      )
        .bind(account_id)
        .all();
    returnObject["preferences"] = res.results[0];
    returnObject["account_id"] = res.results[0]["account_id"];
    return returnObject;
  } else {
    returnObject["preferences"] = res.results[0];
    returnObject["account_id"] = res.results[0]["account_id"];
    return returnObject;
  }
}

export async function handlePut(env, account_id, new_preference) {
  var ret = await handleGet(env, account_id);
  if (!("account_id" in ret)) {
    return {};
  } else {
    const db = drizzle(env.user_prefs_database);
    var preferences = JSON.parse(ret.preferences.preferences);

    for (var key of Object.keys(new_preference)) {
      preferences[key] = new_preference[key];
    }

    await db
      .update(user_preferences)
      .set({
        preferences: preferences,
        last_update_datetime: new Date(),
      })
      .where(eq(user_preferences.account_id, account_id))
      .run();
    return handleGet(env, account_id);
  }
}
