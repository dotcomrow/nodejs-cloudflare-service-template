import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { GCPLogger } from "npm-gcp-logging";
import { GCPBigquery } from "npm-gcp-bigquery";
import { GCPAccessToken } from "npm-gcp-token";
import { GCPUserInfo } from "npm-gcp-userinfo";

export async function handleDelete(env, request) {
  return {};
}
export async function handlePost(env, account_id, request) {
  var logging_token = new GCPAccessToken(
    env.GCP_LOGGING_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/logging.write");
  var bigquery_token = new GCPAccessToken(env.GCP_BIGQUERY_CREDENTIALS);

  var sql =
    `insert into database_dataset.user_preferences (account_id, preferences, created_at, updated_at) 
              values ('` +
    account_id +
    `', PARSE_JSON('` +
    JSON.stringify(request) +
    `'), 
              CURRENT_TIMESTAMP(), 
              CURRENT_TIMESTAMP())`;

  await GCPLogger.logEntry(
    env.GCP_LOGGING_PROJECT_ID,
    logging_token,
    env.LOG_NAME,
    [
      {
        severity: "INFO",
        // textPayload: message,
        jsonPayload: {
          sql_text: sql,
        },
      },
    ]
  );
  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token,
    sql
  );

  return {};
}
export async function handleGet(env, account_id, url_key) {
  var returnObject = {};

  var userinfo_token = new GCPAccessToken(
    env.GCP_USERINFO_CREDENTIALS
  ).getAccessToken(
    "https://www.googleapis.com/auth/admin.directory.group.readonly"
  );
  var userinfo_response = await GCPUserInfo.getUserInfo(
    (
      await userinfo_token
    ).access_token,
    account_id,
    env.DOMAIN
  );

  returnObject["groups"] = userinfo_response.groups;

  var bigquery_token = await new GCPAccessToken(
    env.GCP_BIGQUERY_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/bigquery");

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select format('[%s]', string_agg(to_json_string(p))) from database_dataset.user_preferences p where account_id = '" +
      account_id +
      "'"
  );
  if (!res.rows) {
    var res = await GCPBigquery.query(
      env.GCP_BIGQUERY_PROJECT_ID,
      bigquery_token.access_token,
      "insert into database_dataset.user_preferences (account_id, preferences, created_at, updated_at) values ('" +
        account_id +
        "', JSON '{}', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())"
    );

    returnObject["preferences"] = {};
    returnObject["account_id"] = account_id;
    return returnObject;
  } else {
    var obj = JSON.parse(res.rows[0].f[0].v);
    returnObject["preferences"] = obj[0].preferences;
    returnObject["account_id"] = obj[0].account_id;
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
