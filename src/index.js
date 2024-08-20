import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";
import { default as LogUtility } from "./utils/LoggingUtility.js";

export default {
  async fetch(request, env, context) {
    self.location = new URL("https://www.google.com");
    var loggingContext = await LogUtility.buildLogContext(env);
    try {
      if (request.headers.get("X-Shared-Secret") == env.GLOBAL_SHARED_SECRET) {
        return await handleRequest(request, env, context);
      } else {
        return new Response(JSON.stringify({
          message: "Unauthorized"
        }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    } catch (e) {
      const responseError = serializeError(e);
      await LogUtility.logEntry(loggingContext, [
        {
          severity: "ERROR",
          jsonPayload: {
            message: "Exception occurred in fetch",
            error: serializeError(err),
          },
        },
      ]);
      return new Response(JSON.stringify(responseError), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  },
};
