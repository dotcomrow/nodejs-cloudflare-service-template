import {
  handleGet,
  handlePost,
  handlePut,
  handleDelete,
} from "./requestHandlers.js";
import { dbSetup } from "./databaseOperations.js";

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

  var responseHeaders = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Identity",
    Connection: request.headers.get("Connection"),
    "Content-Type": "application/json",
  };

  if (request.method === "HEAD") {
    console.log("init key -> " + env.INITIALIZATION_KEY);
    console.log("authHeader -> " + authHeader);
    if (
      new String(authHeader).valueOf() ==
      new String(env.INITIALIZATION_KEY).valueOf()
    ) {
      console.log("Init called with init key -> " + env.INITIALIZATION_KEY);
      return new Response(JSON.stringify({ message: await dbSetup(env) }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      console.log("Init called but key not provided or incorrect");
      return new Response(
        JSON.stringify({ message: "Init called but key not provided" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  }

  const googleProfileUrl =
    "https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=" +
    authHeader;

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

  var responseObject = {};
  switch (request.method) {
    case "GET":
      responseObject = await handleGet(
        env,
        accountResponse["id"],
        request.headers.get("Identity")
      );
      break;
    case "PUT":
      var bodyObj = await request.json();
      responseObject = await handlePut(
        env,
        accountResponse["id"],
        bodyObj,
        request.headers.get("Identity")
      );
      break;
    case "POST":
      var bodyObj = await request.json();
      responseObject = await handlePost(
        env,
        accountResponse["id"],
        bodyObj,
        request.headers.get("Identity")
      );
      break;
    case "DELETE":
      responseObject = await handleDelete(
        env,
        accountResponse["id"],
        request.headers.get("Identity")
      );
      break;
  }

  return new Response(JSON.stringify(responseObject), {
    status: 200,
    headers: responseHeaders,
  });
}
