import fetch, { RequestInit } from "node-fetch";
import { TokenType } from "~/db/entities/Auth";
import { AUTH_URL, AUTH_BODY } from "./constants";
import { ApiAuthAccess, ApiAuthError, NewToken } from "./types";
import { qs } from "~/helpers";
import { ParsedUrlQueryInput } from "querystring";
import { getRefresh } from "~/auth";
import { DateTime, Duration } from "luxon";

export const apiAuthUrl = (path: string, qs?: string): string =>
    `${AUTH_URL}/${path}${qs ? `?${qs}` : ""}`;

export const getAuthOptions = async (): Promise<RequestInit> => ({
    headers: { Cookie: `npsso=${await getRefresh()}` },
    body: AUTH_BODY,
});

export const apiAuthFetch = async <T>(
    path: string,
    query?: ParsedUrlQueryInput,
): Promise<T> =>
    fetch(apiAuthUrl(path, qs(query)), await getAuthOptions())
        .then((res) => res.json())
        .catch(({ error, error_description }: ApiAuthError) =>
            Promise.reject({ error, error_description }),
        );

export const renewAccess = async (): Promise<NewToken> => {
    const { access_token, expires_in } = await apiAuthFetch<ApiAuthAccess>(
        "oauth/token",
    );

    return {
        token: access_token,
        expires: DateTime.now()
            .plus(Duration.fromObject({ milliseconds: expires_in }))
            .toJSDate(),
        type: TokenType.ACCESS,
    };
};

export const renewRefresh = async (): Promise<NewToken> => {
    return { token: "", expires: new Date(), type: TokenType.REFRESH };
};
