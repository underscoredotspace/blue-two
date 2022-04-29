import fetch from "node-fetch";
import { Auth, TokenType } from "~/db/entities/Auth";
import { AUTH_URL, AUTH_ACCESS_BODY, AUTH_REFRESH_BODY } from "./constants";
import { ApiAuthAccess, ApiAuthError, ApiAuthRefresh, NewToken } from "./types";
import { getRefresh } from "~/auth";
import { DateTime, Duration } from "luxon";
import { URLSearchParams } from "url";
import { Cookie } from "~/db/entities";

export const apiAuthUrl = (path: string): string => `${AUTH_URL}/${path}`;

export const apiAuthFetch = async <T>(
    path: string,
    options: Record<string, any>,
): Promise<T> =>
    fetch(apiAuthUrl(path), {
        method: "post",
        ...options,
    })
        .then(async (res) => {
            await Cookie.store(res);

            if (`${res.status}`.startsWith("2")) {
                return res;
            }

            throw {
                error: res.statusText,
            };
        })
        .then((res) => res.json())
        .catch((err: ApiAuthError) => {
            const { error, error_description } = err;

            if (error) {
                throw { error, error_description };
            }

            throw err;
        });

export const renewAccess = async (): Promise<NewToken> => {
    const { access_token, expires_in } = await apiAuthFetch<ApiAuthAccess>(
        "oauth/token",
        {
            headers: {
                Cookie: `npsso=${await getRefresh()}`,
            },
            body: new URLSearchParams(AUTH_ACCESS_BODY),
        },
    );

    return {
        token: access_token,
        expires: DateTime.now()
            .plus(Duration.fromObject({ seconds: expires_in }))
            .toJSDate(),
        type: TokenType.ACCESS,
    };
};

export const renewRefresh = async (token?: string): Promise<NewToken> => {
    const existingRefresh =
        token ?? (await Auth.getToken(TokenType.REFRESH))?.token;

    if (typeof existingRefresh === "undefined") {
        throw "Refresh token required";
    }

    const cookies = await Cookie.retrieve();

    const res = await apiAuthFetch<ApiAuthRefresh>("ssocookie", {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0",
            Cookie: cookies,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ...AUTH_REFRESH_BODY,
            npsso: existingRefresh,
        }),
    });

    return {
        token: res.npsso,
        expires: DateTime.now()
            .plus(Duration.fromObject({ seconds: res.expires_in }))
            .toJSDate(),
        type: TokenType.REFRESH,
    };
};
