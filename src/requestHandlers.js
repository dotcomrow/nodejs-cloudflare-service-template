import { GCPLogger } from "npm-gcp-logging";
import { GCPBigquery } from "npm-gcp-bigquery";
import { GCPAccessToken } from "npm-gcp-token";
import { GCPUserInfo } from "npm-gcp-userinfo";

export async function handleDelete(env, request) {
  return {};
}
export async function handlePost(env, account_id, request) {
  return {};
}

export async function handleGet(env, account_id, url_key) {
  var returnObject = {};

  var userinfo_token = new GCPAccessToken(
    env.GCP_USERINFO_CREDENTIALS
  ).getAccessToken(
    "https://www.googleapis.com/auth/admin.directory.group.readonly"
  );
  var userinfo_response = await GCPUserInfo.getUserInfo(
    (
      await userinfo_token
    ).access_token,
    account_id,
    env.DOMAIN
  );

  if (userinfo_response) {
    returnObject["groups"] = userinfo_response.groups;
  }

  var bigquery_token = await new GCPAccessToken(
    env.GCP_BIGQUERY_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/bigquery");

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select format('[%s]', string_agg(to_json_string(p))) from database_dataset.user_preferences p where account_id = '" +
      account_id +
      "'"
  );
  if (!res.rows[0].f[0].v) {
    var res = await GCPBigquery.query(
      env.GCP_BIGQUERY_PROJECT_ID,
      bigquery_token.access_token,
      "insert into database_dataset.user_preferences (account_id, preferences, created_at, updated_at) values ('" +
        account_id +
        "', JSON '{}', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())"
    );

    returnObject["preferences"] = {};
    returnObject["account_id"] = account_id;
    return returnObject;
  } else {
    var obj = JSON.parse(res.rows[0].f[0].v);
    returnObject["preferences"] = obj[0].preferences;
    returnObject["account_id"] = obj[0].account_id;
    return returnObject;
  }
}

export async function handlePut(env, account_id, new_preference) {
  var bigquery_token = await new GCPAccessToken(
    env.GCP_BIGQUERY_CREDENTIALS
  ).getAccessToken("https://www.googleapis.com/auth/bigquery");

  var res = await GCPBigquery.query(
    env.GCP_BIGQUERY_PROJECT_ID,
    bigquery_token.access_token,
    "select format('[%s]', string_agg(to_json_string(p))) from database_dataset.user_preferences p where account_id = '" +
      account_id +
      "'"
  );
  if (res.rows[0].f[0].v) {
    var obj = JSON.parse(res.rows[0].f[0].v);

    for (var key of Object.keys(new_preference)) {
      obj[0].preferences[key] = new_preference[key];
    }
    
    var res = await GCPBigquery.query(
      env.GCP_BIGQUERY_PROJECT_ID,
      bigquery_token.access_token,
      "update database_dataset.user_preferences set preferences = JSON '" +
        JSON.stringify(ret.preferences) +
        "', updated_at = CURRENT_TIMESTAMP() where account_id = '" +
        ret.account_id +
        "'"
    );

    if (res.dmlStats.updatedRowCount > 0) {
      return handleGet(env, account_id);
    } else {
      return {
        message: "Failed to update user preferences"
      };
    }
  } else {
    return {
      message: "Account not found"
    };
  }
}
