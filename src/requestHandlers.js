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

  return env.GRAPHQL.fetch(
    new Request("", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shared-Secret": env.GLOBAL_SHARED_SECRET,
        "X-Auth-User": profile.id,
        "X-Auth-Email": profile.email,
        "X-Auth-Name": profile.name,
        "X-Auth-Profile": profile.picture,
        "X-Auth-Groups": profile.groups,
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
    })
  );
}

export async function handlePut(env, profile, body) {

  if (profile.id == undefined) {
    return {
      message: "No account_id in profile",
    };
  }

  var bigquery_token = await new GCPAccessToken(
    env.GCP_BIGQUERY_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/bigquery");

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select * from pulsedb_dataset.user_info p where id = '" +
      profile.id +
      "'"
  );

  var obj = res[0];
  obj.preferences = JSON.parse(obj.preferences);
  for (var key of Object.keys(body)) {
    obj.preferences[key] = body[key];
  }

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "update pulsedb_dataset.user_info set preferences = JSON '" +
      JSON.stringify(obj.preferences) +
      "', updated_at = CURRENT_TIMESTAMP() where id = '" +
      profile.id +
      "'"
  );

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select * from pulsedb_dataset.user_info p where id = '" +
      profile.id +
      "'"
  );

  return {
    preferences: JSON.parse(res[0].preferences),
    id: res[0].id,
  };
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
