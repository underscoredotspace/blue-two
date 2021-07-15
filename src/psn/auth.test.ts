jest.mock("./constants", () => ({
    get AUTH_URL() {
        return "AUTH_URL";
    },
    get AUTH_BODY() {
        return "AUTH_BODY";
    },
}));

jest.mock("node-fetch");
import fetch from "node-fetch";
const mockFetch = fetch as unknown as jest.Mock;

const mockQs = jest.fn().mockReturnValue("qs");
jest.mock("~/helpers", () => ({
    qs: mockQs,
}));

jest.mock("~/auth", () => ({
    getRefresh: jest.fn().mockResolvedValue("refresh_token"),
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
        const result = apiAuthUrl("path-a", "querystring");
        expect(result).toEqual("AUTH_URL/path-a?querystring");
    });
});

describe("getAuthOptions", () => {
    const { getAuthOptions } = auth;

    test("get auth header and body", async () => {
        const result = await getAuthOptions();
        expect(result).toEqual({
            headers: { Cookie: "npsso=refresh_token" },
            body: "AUTH_BODY",
        });
    });
});

describe("apiAuthFetch", () => {
    const { apiAuthFetch } = auth;

    test("do an auth fetch", async () => {
        const query = {};
        const getAuthOptions = {};

        jest.spyOn(auth, "apiAuthUrl").mockReturnValueOnce("apiAuthUrl");
        jest.spyOn(auth, "getAuthOptions").mockResolvedValueOnce(
            getAuthOptions,
        );
        mockFetch.mockResolvedValueOnce({ json: () => "res" });

        const result = await apiAuthFetch("path", query);

        expect(result).toEqual("res");
        expect(mockFetch).toHaveBeenCalledWith("apiAuthUrl", getAuthOptions);
        expect(auth.apiAuthUrl).toHaveBeenCalledWith("path", "qs");
        expect(mockQs).toHaveBeenCalledWith(query);
    });

    test("should return error", () => {
        mockFetch.mockRejectedValueOnce({
            error: "invalid_client",
            error_description: "Bad client credentials",
            error_code: 4102,
        });

        expect(apiAuthFetch("")).rejects.toEqual({
            error: "invalid_client",
            error_description: "Bad client credentials",
        });
    });
});

describe("renewAccess", () => {
    const { renewAccess } = auth;

    Date.now = jest.fn(() =>
        new Date(Date.UTC(2017, 1, 14, 12, 0, 0)).valueOf(),
    );

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
            expires: new Date("2017-02-14T12:00:01.200Z"),
            token: "new_token",
            type: "access_token",
        });
        expect(mockApiAuthFetch).toHaveBeenCalledWith("oauth/token");
    });

    test("should return error", () => {
        const error = {};
        jest.spyOn(auth, "apiAuthFetch").mockRejectedValueOnce(error);

        expect(renewAccess()).rejects.toEqual(error);
    });
});
