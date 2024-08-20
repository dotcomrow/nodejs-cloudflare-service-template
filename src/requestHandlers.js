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

  var bigquery_token = await new GCPAccessToken(
    env.GCP_BIGQUERY_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/bigquery");

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select * from database_dataset.user_preferences p where account_id = '" +
      profile.id +
      "'"
  );
  if (res.length == 0) {
    var initial_prefs = {};
    var keypair = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    var publicKey = await crypto.subtle.exportKey("jwk", keypair.publicKey);

    var privateKey = await crypto.subtle.exportKey("jwk", keypair.privateKey);

    initial_prefs.publicKey = publicKey;
    initial_prefs.privateKey = privateKey;
    var res = await GCPBigquery.query(
      env.GCP_BIGQUERY_PROJECT_ID,
      bigquery_token.access_token,
      "insert into database_dataset.user_preferences (account_id, preferences, created_at, updated_at) values ('" +
        profile.id +
        "', JSON '" +
        JSON.stringify(initial_prefs) +
        "', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())"
    );

    returnObject["preferences"] = {
      publicKey: publicKey,
    };
    returnObject["account_id"] = profile.id;
    // returnObject["apiToken"] = await generateApiToken(env, publicKey);
    return returnObject;
  } else {
    returnObject["preferences"] = JSON.parse(res[0].preferences);
    returnObject["account_id"] = res[0].account_id;
    // returnObject["apiToken"] = await generateApiToken(env, obj[0].preferences.publicKey);
    return returnObject;
  }
}

export async function handlePut(env, profile, body) {

  var bigquery_token = await new GCPAccessToken(
    env.GCP_BIGQUERY_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/bigquery");

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select * from database_dataset.user_preferences p where account_id = '" +
      profile.id +
      "'"
  );

  var obj = Object.assign({}, res[0]);
  for (var key of Object.keys(body)) {
    obj.preferences[key] = body[key];
  }

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "update database_dataset.user_preferences set preferences = JSON '" +
      JSON.stringify(obj.preferences) +
      "', updated_at = CURRENT_TIMESTAMP() where account_id = '" +
      profile.id +
      "'"
  );

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select * from database_dataset.user_preferences p where account_id = '" +
      profile.id +
      "'"
  );

  return {
    preferences: JSON.parse(res[0].preferences),
    account_id: res[0].account_id,
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
