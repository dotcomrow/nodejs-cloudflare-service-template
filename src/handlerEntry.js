import { sqliteTable } from "drizzle-orm/sqlite-core";
import { jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import {
  handleGet,
  handlePost,
  handlePut,
  handleDelete,
} from "./requestHandlers.js";

export async function handleRequest(request, env, context) {
  var origin = request.headers.get("Origin") || request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const cors_domains = await env.CORS_DOMAINS.split(",");
    var originAllowed = false;
    for (var d in cors_domains) {
      var regex = new RegExp(cors_domains[d]);
      if (regex.test(origin)) {
        originAllowed = true;
      }
    }
    if (!originAllowed) {
      return new Response(
        JSON.stringify({ message: "CORS Not supported -> " + origin }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    return new Response("", {
      status: 204,
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Identity",
        Connection: request.headers.get("Connection"),
      },
    });
  }

  var authHeader = "";
  if (
    request.headers.get("Authorization") != undefined ||
    request.headers.get("authorization") != undefined
  ) {
    if (
      request.headers.get("Authorization") != undefined &&
      request.headers.get("Authorization").startsWith("Bearer ")
    ) {
      authHeader = request.headers.get("Authorization").split(" ")[1];
    } else if (
      request.headers.get("authorization") != undefined &&
      request.headers.get("authorization").startsWith("Bearer ")
    ) {
      authHeader = request.headers.get("authorization").split(" ")[1];
    }
  } else {
    return new Response(
      JSON.stringify({ message: "Authorization header not found." }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
  
  const user_preferences = sqliteTable("user_preferences", {
    account_id: varchar("account_id").notNull().primaryKey(),
    preferences: jsonb("preferences").notNull(),
    last_update_datetime: timestamp("last_update_datetime").notNull(),
  });

  var responseHeaders = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Identity",
    Connection: request.headers.get("Connection"),
    "Content-Type": "application/json",
  };

  const googleProfileUrl =
    "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" + authHeader;

  var response = await fetch(googleProfileUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  var accountResponse = JSON.parse(await response.text());
  if (accountResponse == undefined || accountResponse["id"] == undefined) {
    return new Response(
      JSON.stringify({ message: "Account not found / token invalid." }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const db = drizzle(env.user_prefs_database);
  try {
    await db
      .select()
      .from(user_preferences)
      .where(eq(user_preferences.account_id, accountResponse["id"]));
  } catch (error) {
    await env.user_prefs_database
      .prepare(
        `CREATE TABLE user_preferences (
      account_id varchar(64) PRIMARY KEY,
      preferences jsonb,
      last_update_datetime timestamp)`
      )
      .run();
  }

  var responseObject = {};
  switch (request.method) {
    case "GET":
      responseObject = await handleGet(env, accountResponse["id"], request.headers.get("Identity"));
      break;
    case "PUT":
      var bodyObj = await request.json();
      responseObject = await handlePut(env, accountResponse["id"], bodyObj);
      break;
  }

  return new Response(JSON.stringify(responseObject), {
    status: 200,
    headers: responseHeaders,
  });
}
