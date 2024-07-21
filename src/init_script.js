import { drizzle } from "drizzle-orm/d1";
import { GCPLogger } from "npm-gcp-logging";
import { GCPAccessToken } from "npm-gcp-token";
import { serializeError } from "serialize-error";

export async function init_script(env) {
  const db = drizzle(env.cache);
  try {
    await env.user_prefs_database
      .prepare(
        `CREATE TABLE cache (
      account_id varchar(64) PRIMARY KEY,
      response jsonb,
      last_update_datetime timestamp)`
      )
      .run();
  } catch (e) {
    var logging_token = await new GCPAccessToken(
      env.GCP_LOGGING_CREDENTIALS
    ).getAccessToken("https://www.googleapis.com/auth/logging.write");
    const responseError = serializeError(e);
    await GCPLogger.logEntry(
      env.GCP_LOGGING_PROJECT_ID,
      logging_token.access_token,
      env.LOG_NAME,
      [
        {
          severity: "ERROR",
          // textPayload: message,
          jsonPayload: {
            responseError,
          },
        },
      ]
    );
  }
}
