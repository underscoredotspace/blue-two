jest.mock("./constants", () => ({
    get USER_URL() {
        return "USER_URL";
    },
    get FRIENDS_LIMIT() {
        return 3;
    },
}));

jest.mock("~/helpers");
import { qs } from "~/helpers";
const mockQs = qs as unknown as jest.Mock;

jest.mock("node-fetch");
import fetch from "node-fetch";
const mockFetch = fetch as unknown as jest.Mock;

jest.mock("~/db/entities/Auth");
jest.mock("~/auth", () => ({
    getAccess: jest.fn().mockResolvedValue("access_token"),
}));

import * as user from "./user";

describe("apiUserUrl", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const { apiUserUrl } = user;

    test("only url", () => {
        const result = apiUserUrl("something/123");
        expect(result).toEqual("USER_URL/something/123");
    });

    test("url with querystring", () => {
        const result = apiUserUrl("path-a", "querystring");
        expect(result).toEqual("USER_URL/path-a?querystring");
    });
});

describe("apiUserFetch", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const { apiUserFetch } = user;

    test("make user api request", async () => {
        mockQs.mockReturnValueOnce("qs");
        const userOptions = {};
        const options = {};
        mockFetch.mockResolvedValueOnce({ json: () => "res" });
        const mockApiUrl = jest
            .spyOn(user, "apiUserUrl")
            .mockReturnValue("apiUrl");
        jest.spyOn(user, "getUserOptions").mockResolvedValueOnce(userOptions);

        const res = await apiUserFetch("path-b", options);
        expect(res).toEqual("res");
        expect(mockFetch).toHaveBeenCalledWith("apiUrl", userOptions);
        expect(mockApiUrl).toHaveBeenCalledWith("path-b", "qs");
        expect(mockQs).toHaveBeenCalledWith(options);
    });

    test("return error message when request fails", async () => {
        const error = {
            code: 101,
            message: "this is the error",
        };

        mockFetch.mockRejectedValueOnce({ error });

        await expect(apiUserFetch("path-b")).rejects.toMatch(error.message);
    });

    test("return error message when API returns valid error", async () => {
        const error = {
            message: "error",
        };

        mockFetch.mockResolvedValueOnce({ json: async () => ({ error }) });

        await expect(apiUserFetch("path-b")).rejects.toEqual("error");
    });
});

describe("getFriends", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const makeFrendsRes = (list: string[]) =>
        list.map((onlineId) => ({
            onlineId,
        }));

    const { getFriends } = user;

    test("makes one request to friends", async () => {
        const profiles = makeFrendsRes("abc".split(""));
        mockFetch.mockResolvedValueOnce({
            json: () => ({ profiles, size: 3, totalResults: 3 }),
        });

        const result = await getFriends("userid");
        expect(result).toEqual("abc".split(""));
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test("makes two request to friends, round FRIENDS_LIMIT", async () => {
        const profiles1 = makeFrendsRes("abc".split(""));
        const profiles2 = makeFrendsRes("def".split(""));
        mockFetch
            .mockResolvedValueOnce({
                json: () => ({ profiles: profiles1, size: 3, totalResults: 6 }),
            })
            .mockResolvedValueOnce({
                json: () => ({ profiles: profiles2, size: 3, totalResults: 6 }),
            });

        const result = await getFriends("userid");
        expect(result).toEqual("abcdef".split(""));
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockQs).toHaveBeenNthCalledWith(1, { limit: 3, offset: 0 });
        expect(mockQs).toHaveBeenNthCalledWith(2, { limit: 3, offset: 3 });
    });

    test("makes two request to friends, not round FRIENDS_LIMIT", async () => {
        const profiles1 = makeFrendsRes("abc".split(""));
        const profiles2 = makeFrendsRes("de".split(""));
        mockFetch
            .mockResolvedValueOnce({
                json: () => ({ profiles: profiles1, size: 3, totalResults: 5 }),
            })
            .mockResolvedValueOnce({
                json: () => ({ profiles: profiles2, size: 2, totalResults: 5 }),
            });

        const result = await getFriends("userid");
        expect(result).toEqual("abcde".split(""));
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(mockQs).toHaveBeenNthCalledWith(1, { limit: 3, offset: 0 });
        expect(mockQs).toHaveBeenNthCalledWith(2, { limit: 3, offset: 3 });
    });
});

describe("getCurrentOnlineId", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test("requests currentOnlineId", async () => {
        const mockApiUrl = jest
            .spyOn(user, "apiUserUrl")
            .mockReturnValue("apiUrl");
        mockFetch.mockResolvedValueOnce({
            json: () => ({ profile: { currentOnlineId: "newUserId" } }),
        });

        const res = await user.getCurrentOnlineId("userid");
        expect(res).toEqual("newUserId");
        expect(mockApiUrl).toHaveBeenCalledWith("userid/profile2", undefined);
    });
});
