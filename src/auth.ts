import { DateTime } from "luxon";
import { Auth, TokenType } from "~/db/entities/Auth";
import { renewAccess } from "~/psn/auth";

const graceTime = (type: TokenType) =>
    ({
        [TokenType.ACCESS]: DateTime.now().plus({ minutes: 5 }),
        [TokenType.REFRESH]: DateTime.now().plus({ days: 7 }),
    }[type]);

export const nearExpiry = (token: Auth): boolean => {
    const diff = DateTime.fromJSDate(new Date(token.expires))
        .diff(graceTime(token.type))
        .toMillis();

    return diff <= 0;
};

export const hasExpired = (token: Auth): boolean =>
    DateTime.fromJSDate(new Date(token.expires)).diffNow().toMillis() <= 0;

export const getAccess = async (): Promise<Auth> => {
    const accessToken = await Auth.getToken(TokenType.ACCESS);

    if (accessToken && !nearExpiry(accessToken)) {
        return accessToken;
    }

    const newAccess = await renewAccess();
    await Auth.newToken(newAccess);
    return newAccess as Auth;
};

export const getRefresh = async (): Promise<Auth> => {
    const refreshToken = await Auth.getToken(TokenType.REFRESH);

    if (!refreshToken) {
        throw "Refresh token missing from database";
    }

    if (hasExpired(refreshToken)) {
        throw "Refresh token has expired";
    }

    return refreshToken;
};

export const saveRefresh = async (
    token: string,
    expires: DateTime,
): Promise<void> => {
    await Auth.newToken({
        token,
        expires: expires.toJSDate(),
        type: TokenType.REFRESH,
    });
};
