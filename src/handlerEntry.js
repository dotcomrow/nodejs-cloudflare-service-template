import {
  handleGet,
  handlePost,
  handlePut,
  handleDelete,
} from "./requestHandlers.js";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { init_script } from "./init_script.js";

export async function handleRequest(request, env, context) {
  
  var profile = {
    "id": request.headers.get("X-Auth-User"),
    "email": request.headers.get("X-Auth-Email"),
    "name": request.headers.get("X-Auth-Name"),
    "picture": request.headers.get("X-Auth-Profile"),
    "groups": JSON.parse(request.headers.get("X-Auth-Groups")),
    "provider": request.headers.get("X-Auth-Provider"),
  };

  if (new String(request.method).valueOf().toUpperCase() === "GET") {
    if (
      new String(
        request.url.substring(request.url.lastIndexOf("/") + 1)
      ).valueOf() === new String(env.INITIALIZATION_KEY).valueOf()
    ) {
      var cache_init_msg = await init_script(env);
      return new Response(JSON.stringify({ message: cache_init_msg }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  var req_url = new URL(request.url)
  var query = QueryStringToJSON(req_url.search);

  var responseObject = {};
  switch (request.method) {
    case "GET": {
      const cache = sqliteTable("cache", {
        account_id: varchar("account_id").notNull().primaryKey(),
        response: jsonb("response").notNull(),
        last_update_datetime: timestamp("last_update_datetime").notNull(),
      });

      var res = await db
          .select()
          .from(cache)
          .where(eq(cache.account_id, profile.id));
      if (res.length == 0) {
        responseObject = await handleGet(env, profile, query, req_url.pathname.split("/").pop());
        await db
          .insert(cache)
          .values({
            account_id: profile.id,
            response: responseObject,
            last_update_datetime: new Date(),
          })
          .execute();
      } else {
        responseObject = res[0].response;
      }
      break;
    }
    case "PUT":
      var bodyObj = await request.json();
      responseObject = await handlePut(env, profile, bodyObj);
      break;
    case "POST":
      var bodyObj = await request.json();
      responseObject = await handlePost(env, profile, bodyObj);
      break;
    case "DELETE":
      responseObject = await handleDelete(env, profile, query, req_url.pathname.split("/").pop());
      break;
  }

  return new Response(JSON.stringify(responseObject), {
    status: 200
  });
}

function QueryStringToJSON(query) {
  var pairs = query.slice(1).split("&");

  var result = {};
  pairs.forEach(function (pair) {
    pair = pair.split("=");
    result[pair[0]] = decodeURIComponent(pair[1] || "");
  });

  return JSON.parse(JSON.stringify(result));
}
