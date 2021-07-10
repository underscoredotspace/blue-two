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

import { apiUrl, apiUserFetch, getFriends } from "./user";

describe("apiUrl", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("only url", () => {
        const result = apiUrl("something/123");
        expect(result).toEqual("USER_URL/something/123");
    });

    test("url with querystring", () => {
        const result = apiUrl("path-a", "querystring");
        expect(result).toEqual("USER_URL/path-a?querystring");
    });
});

describe("apiFetch", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("make api request", async () => {
        mockFetch.mockResolvedValueOnce({ json: () => "res" });
        const options = { a: 1 };
        mockQs.mockReturnValue("a=1");
        const res = await apiUserFetch("path-b", options);

        expect(mockFetch).toHaveBeenCalledWith("USER_URL/path-b?a=1");
        expect(mockQs).toHaveBeenCalledWith(options);
        expect(res).toEqual("res");
    });

    test("return error message when request fails", async () => {
        const error = {
            code: 101,
            message: "this is the error",
        };

        mockFetch.mockRejectedValueOnce({ error });

        await expect(apiUserFetch("path-b")).rejects.toMatch(error.message);
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
