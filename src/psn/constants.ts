import { env } from "~/helpers";

export const USER_URL =
    "https://nl-prof.np.community.playstation.net/userProfile/v1/users";

export const AUTH_URL = "https://auth.api.sonyentertainmentnetwork.com/2.0";

export const client_id = "71a7beb8-f21a-47d9-a604-2e71bee24fe0";

export const AUTH_ACCESS_BODY = {
    grant_type: "sso_cookie",
    scope: "openid:user_id openid:ctry_code openid:lang kamaji:get_privacy_settings kamaji:get_account_hash",
    client_id,
    client_secret: "xSk2YI8qJqZfeLQv",
} as any;

export const AUTH_REFRESH_BODY = {
    authentication_type: "password_gating",
    password: env.PSN_PASSWORD,
    client_id,
};

export const FRIENDS_LIMIT = 500;
