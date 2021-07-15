import fetch from "node-fetch";
import { Auth, TokenType } from "~/db/entities/Auth";
import { AUTH_URL, AUTH_ACCESS_BODY, AUTH_REFRESH_BODY } from "./constants";
import { ApiAuthAccess, ApiAuthError, ApiAuthRefresh, NewToken } from "./types";
import { getRefresh } from "~/auth";
import { DateTime, Duration } from "luxon";
import { URLSearchParams } from "url";

export const apiAuthUrl = (path: string): string => `${AUTH_URL}/${path}`;

export const apiAuthFetch = async <T>(
    path: string,
    options: Record<string, any>,
): Promise<T> =>
    fetch(apiAuthUrl(path), { method: "post", ...options })
        .then((res) => res.json())
        .catch(({ error, error_description }: ApiAuthError) =>
            Promise.reject({ error, error_description }),
        );

export const renewAccess = async (): Promise<NewToken> => {
    const { access_token, expires_in } = await apiAuthFetch<ApiAuthAccess>(
        "oauth/token",
        {
            headers: { Cookie: `npsso=${await getRefresh()}` },
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

export const renewRefresh = async (): Promise<NewToken> => {
    const existingRefresh = await Auth.getToken(TokenType.REFRESH);

    const { expires_in, npsso } = await apiAuthFetch<ApiAuthRefresh>(
        "ssocookie",
        {
            body: {
                ...AUTH_REFRESH_BODY,
                npsso: existingRefresh?.token,
            },
        },
    );

    return {
        token: npsso,
        expires: DateTime.now()
            .plus(Duration.fromObject({ seconds: expires_in }))
            .toJSDate(),
        type: TokenType.REFRESH,
    };
};
