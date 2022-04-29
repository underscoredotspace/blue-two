const mockRenewAccess = jest.fn();
const mockRenewRefresh = jest.fn();
jest.mock("~/psn/auth", () => ({
    renewAccess: mockRenewAccess,
    renewRefresh: mockRenewRefresh,
}));

const mockGetToken = jest.fn().mockReturnValue({ type: "", expires: "" });
const mockNewToken = jest.fn();

jest.mock("~/db/entities/Auth", () => ({
    ...jest.requireActual("~/db/entities/Auth"),
    Auth: { getToken: mockGetToken, newToken: mockNewToken },
}));

import * as auth from "./auth";
import { TokenType } from "~/db/entities/Auth";

Date.now = jest.fn(() => new Date(Date.UTC(2017, 1, 14, 12, 0, 0)).valueOf());

describe("hasExpired", () => {
    test.each`
        type                 | expires                                        | expected
        ${TokenType.ACCESS}  | ${new Date(Date.UTC(2017, 1, 14, 11, 54, 59))} | ${false}
        ${TokenType.ACCESS}  | ${new Date(Date.UTC(2017, 1, 14, 11, 55, 0))}  | ${true}
        ${TokenType.REFRESH} | ${new Date(Date.UTC(2017, 1, 7, 11, 59, 59))}  | ${false}
        ${TokenType.REFRESH} | ${new Date(Date.UTC(2017, 1, 7, 12, 0, 0))}    | ${true}
    `("$type, $expected)", ({ type, expires, expected }) => {
        expect(auth.hasExpired({ type, expires } as any)).toBe(expected);
    });
});

describe("getAccess", () => {
    const mockHasExpired = jest.spyOn(auth, "hasExpired");

    test("Access exists in the database, and is not expired ", async () => {
        const existing = { token: {} };
        mockGetToken.mockReturnValueOnce(existing);
        mockHasExpired.mockReturnValueOnce(false);
        const result = await auth.getAccess();
        expect(result).toBe(existing.token);
    });

    test("Access is in database, but is expired", async () => {
        const newToken = { token: {} };
        mockHasExpired.mockReturnValueOnce(true);
        mockRenewAccess.mockResolvedValueOnce(newToken);

        const result = await auth.getAccess();
        expect(mockRenewAccess).toHaveBeenCalled();
        expect(result).toBe(newToken.token);
    });

    test("renewAccess error should bubble up", async () => {
        const error = {};
        mockHasExpired.mockReturnValueOnce(true);
        mockRenewAccess.mockRejectedValueOnce(error);

        expect(auth.getAccess()).rejects.toBe(error);
    });
});

describe("getRefresh", () => {
    const mockHasExpired = jest.spyOn(auth, "hasExpired");

    test("Refresh exists in the database, and is not expired ", async () => {
        const existing = { token: {} };
        mockGetToken.mockReturnValueOnce(existing);
        mockHasExpired.mockReturnValueOnce(false);
        const result = await auth.getRefresh();
        expect(result).toBe(existing.token);
    });

    test("Refresh is in database, but is expired", async () => {
        const newToken = { token: {} };
        mockHasExpired.mockReturnValueOnce(true);
        mockRenewRefresh.mockResolvedValueOnce(newToken);

        const result = await auth.getRefresh();
        expect(mockRenewAccess).toHaveBeenCalled();
        expect(result).toBe(newToken.token);
    });

    test("renewRefresh error should bubble up", async () => {
        const error = {};
        mockHasExpired.mockReturnValueOnce(true);
        mockRenewRefresh.mockRejectedValueOnce(error);

        expect(auth.getRefresh()).rejects.toBe(error);
    });

    test("Refresh is not in database", () => {
        mockGetToken.mockResolvedValueOnce(undefined);
        expect(auth.getRefresh()).rejects.toMatch(
            "Refresh token missing from database",
        );
    });
});

describe("saveRefresh", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const valid_token = "temp_new_token";

    test("Should save given token and request a new one", async () => {
        const newToken = { token: {} };
        mockRenewRefresh.mockResolvedValueOnce(newToken);
        await auth.saveRefresh(valid_token);

        expect(mockRenewRefresh).toHaveBeenCalledWith(valid_token);
        expect(mockNewToken).toHaveBeenCalledWith(newToken);
    });

    test("Should return error if refresh fails", async () => {
        const error = {};
        mockRenewRefresh.mockRejectedValueOnce(error);
        expect(auth.saveRefresh(valid_token)).rejects.toBe(error);
    });

    test("Should return error if database insert fails", () => {
        const error = {};
        mockNewToken.mockRejectedValueOnce(error);
        expect(auth.saveRefresh(valid_token)).rejects.toBe(error);
    });
});
