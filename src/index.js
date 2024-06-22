import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";
import GCloudLogger from "npm-gcp-logging"

export default {
  async fetch(request, env, context) {
    try {
      const projectId = 'gcploggingproject-427121'; // replace with your GCP project ID  
      const logger = new GCloudLogger(projectId, env.GCP_LOGGING_CREDENTIALS);

      const logName = 'my-log';
      const severity = 'ERROR';
      const message = 'This is a log message.';

      logger.logEntry(logName, severity, message);

      return await handleRequest(request, env, context);
    } catch (e) {
      const responseError = serializeError(e);
      return new Response(JSON.stringify(responseError), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }
}