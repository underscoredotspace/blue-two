jest.mock("./constants", () => ({
    get AUTH_URL() {
        return "AUTH_URL";
    },
    get AUTH_ACCESS_BODY() {
        return "AUTH_ACCESS_BODY";
    },
    get AUTH_REFRESH_BODY() {
        return { yep: "AUTH_REFRESH_BODY" };
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
    getRefresh: jest.fn().mockResolvedValue("refresh_token"),
}));

Date.now = jest.fn(() => new Date(Date.UTC(2017, 1, 14, 12, 0, 0)).valueOf());

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
        mockFetch.mockResolvedValueOnce({ json: () => "res" });

        const result = await apiAuthFetch("path", options);

        expect(result).toEqual("res");
        expect(mockFetch).toHaveBeenCalledWith("apiAuthUrl", {
            a: 1,
            method: "post",
        });
        expect(auth.apiAuthUrl).toHaveBeenCalledWith("path");
    });

    test("should return error", () => {
        mockFetch.mockRejectedValueOnce({
            error: "invalid_client",
            error_description: "Bad client credentials",
            error_code: 4102,
        });

        expect(apiAuthFetch("", {})).rejects.toEqual({
            error: "invalid_client",
            error_description: "Bad client credentials",
        });
    });
});

describe("renewAccess", () => {
    const { renewAccess } = auth;

    beforeEach(() => {
        jest.clearAllMocks();
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

        expect(renewAccess()).rejects.toEqual(error);
    });
});

describe("renewRefresh", () => {
    const { renewRefresh } = auth;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return refresh", async () => {
        const mockApiAuthFetch = jest
            .spyOn(auth, "apiAuthFetch")
            .mockResolvedValueOnce({
                npsso: "new_npsso",
                expires_in: 5184000,
            });

        mockGetToken.mockResolvedValueOnce({ token: "existing_token" });

        const result = await renewRefresh();

        expect(result).toEqual({
            expires: new Date("2017-04-15T12:00:00.000Z"),
            token: "new_npsso",
            type: "npsso",
        });
        expect(mockApiAuthFetch).toHaveBeenCalledWith("ssocookie", {
            body: {
                yep: "AUTH_REFRESH_BODY",
                npsso: "existing_token",
            },
        });
    });

    test("should return error", () => {
        const error = {};
        jest.spyOn(auth, "apiAuthFetch").mockRejectedValueOnce(error);

        expect(renewRefresh()).rejects.toEqual(error);
    });
});
