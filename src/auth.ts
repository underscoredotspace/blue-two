import { Duration, DateTime } from "luxon";
import { Auth, TokenType } from "~/db/entities/Auth";
import { renewAccess, renewRefresh } from "~/psn/auth";

const GRACE_TIMES = {
    [TokenType.ACCESS]: Duration.fromObject({ minutes: 5 }),
    [TokenType.REFRESH]: Duration.fromObject({ days: 7 }),
};

const hasExpired = (token: Auth) =>
    DateTime.fromJSDate(token.expires).diffNow() <= GRACE_TIMES[token.type];

export const getAccess = async (): Promise<string> => {
    const accessToken = await Auth.getToken(TokenType.ACCESS);
    if (accessToken && !hasExpired(accessToken)) {
        return accessToken.token;
    }

    try {
        const newAccess = await renewAccess();
        await Auth.newToken(newAccess);
        return newAccess.token;
    } catch (error) {
        throw new Error(error);
    }
};

export const getRefresh = async (): Promise<string> => {
    const refreshToken = await Auth.getToken(TokenType.REFRESH);
    if (refreshToken && !hasExpired(refreshToken)) {
        return refreshToken.token;
    }

    try {
        const newRefresh = await renewRefresh();
        await Auth.newToken(newRefresh);
        return newRefresh.token;
    } catch (error) {
        throw new Error(error);
    }
};
