const mockRenewAccess = jest.fn();
jest.mock("~/psn/auth", () => ({
    renewAccess: mockRenewAccess,
}));

const mockGetToken = jest
    .fn()
    .mockReturnValue({ type: "REFRESH", expires: "" });
const mockNewToken = jest.fn();

jest.mock("~/db/entities/Auth", () => ({
    ...jest.requireActual("~/db/entities/Auth"),
    Auth: { getToken: mockGetToken, newToken: mockNewToken },
}));

import * as auth from "./auth";
import { TokenType } from "~/db/entities/Auth";

describe("hasExpired", () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(
            new Date("2020-06-07T12:00:00.000Z"),
        );
    });

    test.each`
        expires                       | expected
        ${"2020-06-07T11:59:59.999Z"} | ${true}
        ${"2020-06-07T12:00:00.000Z"} | ${true}
        ${"2020-05-07T12:00:00.001Z"} | ${true}
        ${"2020-06-07T12:00:00.001Z"} | ${false}
        ${"2022-06-07T12:00:00.001Z"} | ${false}
    `("hasExpired('$expires'): $expected", ({ expires, expected }) => {
        expect(auth.hasExpired({ expires } as any)).toBe(expected);
    });
});

describe("nearExpiry", () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(
            new Date("2020-06-14T12:00:00.000Z"),
        );
    });

    test.each`
        type                 | expires                       | expected | comment
        ${TokenType.ACCESS}  | ${"2020-06-14T12:00:00.000Z"} | ${true}  | ${"Access expired now"}
        ${TokenType.ACCESS}  | ${"2020-06-14T12:05:00.000Z"} | ${true}  | ${"Access expiring in 5m"}
        ${TokenType.ACCESS}  | ${"2020-06-14T12:05:00.001Z"} | ${false} | ${"Access expiring in 5m 1ms"}
        ${TokenType.ACCESS}  | ${"2020-06-14T13:00:00.000Z"} | ${false} | ${"Access expiring in 60m"}
        ${TokenType.REFRESH} | ${"2020-06-14T12:00:00.000Z"} | ${true}  | ${"Refresh expired now"}
        ${TokenType.REFRESH} | ${"2020-06-21T12:00:00.000Z"} | ${true}  | ${"Refresh expiring in 7d"}
        ${TokenType.REFRESH} | ${"2020-06-21T12:00:00.001Z"} | ${false} | ${"Refresh expiring in 7d 1ms"}
        ${TokenType.REFRESH} | ${"2020-06-28T12:00:00.000Z"} | ${false} | ${"Refresh expiring in 14d"}
    `("$expected, $comment", ({ type, expires, expected }) => {
        expect(auth.nearExpiry({ type, expires } as any)).toBe(expected);
    });
});

describe("getAccess", () => {
    const mockNearExpiry = jest.spyOn(auth, "nearExpiry");

    test("Access exists in the database, and is not expired ", async () => {
        const existing = { token: {} };
        mockGetToken.mockReturnValueOnce(existing);
        mockNearExpiry.mockReturnValueOnce(false);
        const result = await auth.getAccess();
        expect(result).toBe(existing);
    });

    test("Access is in database, but is expired", async () => {
        const newToken = { token: {} };
        mockNearExpiry.mockReturnValueOnce(true);
        mockRenewAccess.mockResolvedValueOnce(newToken);

        const result = await auth.getAccess();
        expect(mockRenewAccess).toHaveBeenCalled();
        expect(result).toBe(newToken);
    });

    test("renewAccess error should bubble up", async () => {
        const error = {};
        mockNearExpiry.mockReturnValueOnce(true);
        mockRenewAccess.mockRejectedValueOnce(error);

        return expect(auth.getAccess()).rejects.toBe(error);
    });
});

describe("getRefresh", () => {
    const mockHasExpired = jest.spyOn(auth, "hasExpired");

    test("Refresh exists in the database, and is not expired ", async () => {
        const existing = { token: {} };
        mockGetToken.mockReturnValueOnce(existing);
        mockHasExpired.mockReturnValueOnce(false);
        const result = await auth.getRefresh();
        expect(result).toBe(existing);
    });

    test("Refresh is in database, but is expired", async () => {
        mockHasExpired.mockReturnValueOnce(true);

        expect(mockRenewAccess).toHaveBeenCalled();
        return expect(auth.getRefresh()).rejects.toEqual(
            "Refresh token has expired",
        );
    });

    test("Refresh is not in database", () => {
        mockGetToken.mockResolvedValueOnce(undefined);
        return expect(auth.getRefresh()).rejects.toMatch(
            "Refresh token missing from database",
        );
    });
});
