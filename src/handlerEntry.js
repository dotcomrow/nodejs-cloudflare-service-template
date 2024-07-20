import {
  handleGet,
  handlePost,
  handlePut,
  handleDelete,
} from "./requestHandlers.js";

export async function handleRequest(request, env, context) {
  
  var profile = {
    "id": request.headers.get("X-Auth-User"),
    "email": request.headers.get("X-Auth-Email"),
    "name": request.headers.get("X-Auth-Name"),
    "picture": request.headers.get("X-Auth-Profile"),
    "groups": request.headers.get("X-Auth-Groups"),
    "provider": request.headers.get("X-Auth-Provider"),
  };

  var req_url = new URL(request.url)
  var query = QueryStringToJSON(req_url.search);

  var responseObject = {};
  switch (request.method) {
    case "GET":
      responseObject = await handleGet(env, profile, query, req_url.pathname.split("/").pop());
      break;
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
