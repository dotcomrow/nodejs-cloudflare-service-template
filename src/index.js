import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";
const {Logging} = require('@google-cloud/logging');

export default {
  async fetch(request, env, context) {
    const logging = new Logging();
    const logName = await env.LOG_NAME;
    const log = logging.log(logName);

    const metadata = {
      severity: 'DEBUG',
      resource: {
        type: 'global',
      },
    };
  
    const message = {
      name: 'Worker ' + env.WORKER_NAME,
      information: "Request received",
    };
    log.entry(metadata, message);
    try {
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