jest.mock("./constants", () => ({
    get AUTH_URL() {
        return "AUTH_URL";
    },
    get AUTH_ACCESS_BODY() {
        return "AUTH_ACCESS_BODY";
    },
}));

jest.mock("node-fetch");
import fetch from "node-fetch";
import { URLSearchParams } from "url";
const mockFetch = fetch as unknown as jest.Mock;

const mockGetToken = jest.fn();
jest.mock("~/db/entities/Auth", () => ({
    ...jest.requireActual("~/db/entities/Auth"),
    Auth: {
        getToken: mockGetToken,
    },
}));

jest.mock("~/auth", () => ({
    getRefresh: jest.fn().mockResolvedValue({ token: "refresh_token" }),
}));

import * as auth from "./auth";

describe("apiAuthUrl", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const { apiAuthUrl } = auth;

    test("only url", () => {
        const result = apiAuthUrl("something/123");
        expect(result).toEqual("AUTH_URL/something/123");
    });

    test("url with querystring", () => {
        const result = apiAuthUrl("path-a");
        expect(result).toEqual("AUTH_URL/path-a");
    });
});

describe("apiAuthFetch", () => {
    const { apiAuthFetch } = auth;

    test("do an auth fetch", async () => {
        const options = { a: 1 };

        jest.spyOn(auth, "apiAuthUrl").mockReturnValueOnce("apiAuthUrl");
        mockFetch.mockResolvedValueOnce({ status: 200, json: () => "res" });

        const result = await apiAuthFetch("path", options);

        expect(result).toEqual("res");
        expect(mockFetch).toHaveBeenCalledWith("apiAuthUrl", {
            a: 1,
            method: "post",
        });
        expect(auth.apiAuthUrl).toHaveBeenCalledWith("path");
    });

    test("should return formatted API error", () => {
        mockFetch.mockRejectedValueOnce({
            error: "invalid_client",
            error_description: "Bad client credentials",
            error_code: 4102,
        });

        return expect(apiAuthFetch("", {})).rejects.toEqual({
            error: "invalid_client",
            error_description: "Bad client credentials",
        });
    });

    test("should return error if doesn't fit format", () => {
        const error = {};
        mockFetch.mockRejectedValueOnce(error);

        return expect(apiAuthFetch("", {})).rejects.toEqual(error);
    });

    test("should return error if response not in 2xx", () => {
        mockFetch.mockResolvedValueOnce({
            status: 400,
            statusText: "Bad request",
        });

        return expect(apiAuthFetch("", {})).rejects.toEqual({
            error: 400,
            error_description: "Bad request",
        });
    });
});

describe("renewAccess", () => {
    const { renewAccess } = auth;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers().setSystemTime(
            new Date("2017-02-14T12:00:00.000Z"),
        );
    });

    test("should return access", async () => {
        const mockApiAuthFetch = jest
            .spyOn(auth, "apiAuthFetch")
            .mockResolvedValueOnce({
                access_token: "new_token",
                expires_in: 1200,
            });

        const result = await renewAccess();

        expect(result).toEqual({
            expires: new Date("2017-02-14T12:20:00.000Z"),
            token: "new_token",
            type: "access_token",
        });
        expect(mockApiAuthFetch).toHaveBeenCalledWith("oauth/token", {
            body: new URLSearchParams("AUTH_ACCESS_BODY"),
            headers: { Cookie: "npsso=refresh_token" },
        });
    });

    test("should return error", () => {
        const error = {};
        jest.spyOn(auth, "apiAuthFetch").mockRejectedValueOnce(error);

        return expect(renewAccess()).rejects.toEqual(error);
    });
});
