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
        ${"2020-06-07T12:00:00.000Z"} | ${true}
        ${"2020-06-07T11:59:59.999Z"} | ${false}
    `("hasExpired('$expires'): $expected", ({ expires, expected }) => {
        expect(auth.hasExpired({ expires } as any)).toBe(expected);
    });
});

describe("nearExpiry", () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(
            new Date("2020-06-14T12:05:00.000Z"),
        );
    });

    test.each`
        type                 | expires                       | expected
        ${TokenType.ACCESS}  | ${"2020-06-14T12:00:00.000Z"} | ${true}
        ${TokenType.ACCESS}  | ${"2020-06-14T11:59:59.999Z"} | ${false}
        ${TokenType.REFRESH} | ${"2020-06-07T12:05:00.000Z"} | ${true}
        ${TokenType.REFRESH} | ${"2020-06-07T12:04:59.999Z"} | ${false}
    `(
        "nearExpiry('$type', '$expires'): $expected",
        ({ type, expires, expected }) => {
            expect(auth.nearExpiry({ type, expires } as any)).toBe(expected);
        },
    );
});

describe("getAccess", () => {
    const mockNearExpiry = jest.spyOn(auth, "nearExpiry");

    test("Access exists in the database, and is not expired ", async () => {
        const existing = { token: {} };
        mockGetToken.mockReturnValueOnce(existing);
        mockNearExpiry.mockReturnValueOnce(false);
        const result = await auth.getAccess();
        expect(result).toBe(existing.token);
    });

    test("Access is in database, but is expired", async () => {
        const newToken = { token: {} };
        mockNearExpiry.mockReturnValueOnce(true);
        mockRenewAccess.mockResolvedValueOnce(newToken);

        const result = await auth.getAccess();
        expect(mockRenewAccess).toHaveBeenCalled();
        expect(result).toBe(newToken.token);
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
