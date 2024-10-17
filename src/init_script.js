import { serializeError } from "serialize-error";
import { default as LogUtility } from "./utils/LoggingUtility.js";

export async function init_script(env) {
  var loggingContext = await LogUtility.buildLogContext(env);
  try {
    await env.cache
      .prepare(
        `CREATE TABLE cache (
      account_id varchar(64) PRIMARY KEY,
      response jsonb,
      last_update_datetime numeric)`
      )
      .run();
  } catch (e) {
    await LogUtility.logEntry(loggingContext, [
      {
        severity: "ERROR",
        jsonPayload: {
          message: "Exception occurred in fetch",
          error: serializeError(e),
        },
      },
    ]);
  }
}
