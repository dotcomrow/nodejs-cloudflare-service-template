import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";
import GCloudLogger from "npm-gcp-logging"

export default {
  async fetch(request, env, context) {
    try {
      return await handleRequest(request, env, context);
    } catch (e) {
      const responseError = serializeError(e);
      GCloudLogger.default.logEntry(env.GCP_LOGGING_PROJECT_ID, env.GCP_LOGGING_CREDENTIALS,env.LOG_NAME, 
        [
          {
            severity: "ERROR",
            // textPayload: message,
            jsonPayload: responseError
          },
        ]
      );
      return new Response(JSON.stringify(responseError), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }
}