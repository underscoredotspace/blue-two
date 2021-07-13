const mockRequestAccess = jest.fn();
const mockRequestRefresh = jest.fn();
jest.mock("~/psn/auth", () => ({
    renewAccess: mockRequestAccess,
    renewRefresh: mockRequestRefresh,
}));

const mockGetToken = jest.fn().mockReturnValue({ type: "", expires: "" });
jest.mock("~/db/entities/Auth", () => ({
    ...jest.requireActual("~/db/entities/Auth"),
    Auth: { getToken: mockGetToken, newToken: jest.fn() },
}));

import { hasExpired, getAccess } from "./auth";
import { TokenType } from "~/db/entities/Auth";

describe("hasExpired", () => {
    Date.now = jest.fn(() =>
        new Date(Date.UTC(2017, 1, 14, 12, 0, 0)).valueOf(),
    );

    test.each`
        type                 | expires                                        | expected
        ${TokenType.ACCESS}  | ${new Date(Date.UTC(2017, 1, 14, 11, 54, 59))} | ${false}
        ${TokenType.ACCESS}  | ${new Date(Date.UTC(2017, 1, 14, 11, 55, 0))}  | ${true}
        ${TokenType.REFRESH} | ${new Date(Date.UTC(2017, 1, 7, 11, 59, 59))}  | ${false}
        ${TokenType.REFRESH} | ${new Date(Date.UTC(2017, 1, 7, 12, 0, 0))}    | ${true}
    `("$type, $expected)", ({ type, expires, expected }) => {
        expect(hasExpired({ type, expires } as any)).toBe(expected);
    });
});

describe("getAccess", () => {
    const mockHasExpired = jest.fn().mockReturnValue(false);

    jest.mock("./auth", () => ({
        ...jest.requireActual("./auth"),
        hasExpired: mockHasExpired,
    }));

    test("Access exists in the database, and is not expired ", async () => {
        const access = { token: {} };
        mockGetToken.mockReturnValueOnce(access);
        const result = await getAccess();
        expect(result).toBe(access.token);
    });
});
