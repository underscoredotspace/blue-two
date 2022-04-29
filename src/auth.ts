import { Duration, DateTime } from "luxon";
import { Auth, TokenType } from "~/db/entities/Auth";
import { renewAccess, renewRefresh } from "~/psn/auth";

const GRACE_TIMES = {
    [TokenType.ACCESS]: Duration.fromObject({ minutes: 5 }).negate(),
    [TokenType.REFRESH]: Duration.fromObject({ days: 7 }).negate(),
};

export const hasExpired = (token: Auth): boolean =>
    DateTime.fromJSDate(token.expires).diffNow() >= GRACE_TIMES[token.type];

export const getAccess = async (): Promise<string> => {
    const accessToken = await Auth.getToken(TokenType.ACCESS);
    if (accessToken && !hasExpired(accessToken)) {
        return accessToken.token;
    }

    const newAccess = await renewAccess();
    await Auth.newToken(newAccess);
    return newAccess.token;
};

export const getRefresh = async (): Promise<string> => {
    const refreshToken = await Auth.getToken(TokenType.REFRESH);
    if (refreshToken && !hasExpired(refreshToken)) {
        return refreshToken.token;
    }

    if (!refreshToken) {
        throw "Refresh token missing from database";
    }

    const newRefresh = await renewRefresh();
    await Auth.newToken(newRefresh);
    return newRefresh.token;
};

export const saveRefresh = async (token: string): Promise<void> => {
    await Auth.newToken({
        token,
        expires: DateTime.now()
            .plus(Duration.fromObject({ minutes: 5 }))
            .toJSDate(),
        type: TokenType.REFRESH,
    });
    const newToken = await renewRefresh(token);
    await Auth.newToken(newToken);
};
