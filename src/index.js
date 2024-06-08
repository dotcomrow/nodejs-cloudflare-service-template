import { handleRequest } from "./handlerEntry.js";
import { serializeError } from "serialize-error";

export default {
  async fetch(request, env, context) {
    try {
      console.log("handleRequest")
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