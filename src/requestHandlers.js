import { GCPBigquery } from "npm-gcp-bigquery";
import { GCPAccessToken } from "npm-gcp-token";

export async function handleDelete(env, profile, query, itemId) {
  return {};
}
export async function handlePost(env, profile, body) {
  return {};
}

export async function handleGet(env, profile, query, itemId) {
  var returnObject = {};

  if (profile.id == undefined) {
    return {
      message: "No account_id in profile",
    };
  }

  var ret = await env.GRAPHQL.fetch("https://local/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shared-Secret": env.GLOBAL_SHARED_SECRET,
      "X-Auth-User": profile.id,
      "X-Auth-Email": profile.email,
      "X-Auth-Name": profile.name,
      "X-Auth-Profile": profile.picture,
      "X-Auth-Groups": JSON.stringify(profile.groups),
      "X-Auth-Provider": profile.provider,
    },
    body: JSON.stringify({
      query: `query {
          user {
            id
            preferences {
              key
              value
            }
          }
        }`,
    }),
  });

  var resBody = await ret.json();
  return resBody.data.user;
}

export async function handlePut(env, profile, body) {
  if (profile.id == undefined) {
    return {
      message: "No account_id in profile",
    };
  }

  var bodyJson = JSON.stringify({
    query: `mutation updateUserPreferences($preferences: PreferencesInput!) {
        updateUserPreferences(preferences: $preferences) {
            id
        }
    }`,
    variables: `{
        "preferences": {
            "key":` + Object.keys(body)[0] + `,
            "value":` + body[Object.keys(body)[0]] + `
        }
    }`,
  });
  console.log(bodyJson);

  var ret = await env.GRAPHQL.fetch("https://local/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shared-Secret": env.GLOBAL_SHARED_SECRET,
      "X-Auth-User": profile.id,
      "X-Auth-Email": profile.email,
      "X-Auth-Name": profile.name,
      "X-Auth-Profile": profile.picture,
      "X-Auth-Groups": JSON.stringify(profile.groups),
      "X-Auth-Provider": profile.provider,
    },
    body: bodyJson,
  });

  var resBody = await ret.json();
  return resBody.data.user;
}

async function generateApiToken(env, publicKey) {
  var pk = await crypto.subtle.importKey(
    "jwk",
    publicKey,
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
  var token = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    pk,
    new ArrayBuffer(env.GLOBAL_SHARED_SECRET)
  );
  return arrayBufferToBase64(token);
}

function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
