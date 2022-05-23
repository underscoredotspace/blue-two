import fetch from "node-fetch";
import { TokenType } from "~/db/entities/Auth";
import { AUTH_URL, AUTH_ACCESS_BODY } from "./constants";
import { ApiAuthAccess, ApiAuthError, NewToken } from "./types";
import { getRefresh } from "~/auth";
import { DateTime, Duration } from "luxon";
import { URLSearchParams } from "url";

export const apiAuthUrl = (path: string): string => `${AUTH_URL}/${path}`;

export const apiAuthFetch = async <T>(
    path: string,
    options: Record<string, any>,
): Promise<T> => {
    const url = apiAuthUrl(path);

    return fetch(url, {
        method: "post",
        ...options,
    })
        .then(async (res) => {
            if (`${res.status}`.startsWith("2")) {
                return res;
            }

            throw {
                error: res.status,
                error_description: res.statusText,
            };
        })
        .then(async (res) => res.json())
        .catch((err: ApiAuthError) => {
            const { error, error_description } = err;

            if (error) {
                throw { error, error_description };
            }

            throw err;
        });
};

export const renewAccess = async (): Promise<NewToken> => {
    const { access_token, expires_in } = await apiAuthFetch<ApiAuthAccess>(
        "oauth/token",
        {
            headers: {
                Cookie: `npsso=${(await getRefresh()).token}`,
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
