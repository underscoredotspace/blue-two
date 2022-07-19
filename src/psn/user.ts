import fetch, { RequestInit } from "node-fetch";
import { ParsedUrlQueryInput } from "querystring";
import { getAccess } from "~/auth";
import { qs } from "~/helpers";
import { USER_URL, FRIENDS_LIMIT } from "./constants";
import { ApiUserError, ApiFriends, ApiProfile2 } from "./types";

export const apiUserUrl = (path: string, qs?: string): string =>
    `${USER_URL}/${path}${qs ? `?${qs}` : ""}`;

export const getUserOptions = async (): Promise<RequestInit> =>
    getAccess().then(({ token }) => ({
        headers: { Authorization: `Bearer ${token}` },
    }));

export const apiUserFetch = async <T>(
    path: string,
    query?: ParsedUrlQueryInput,
): Promise<T> => {
    const url = apiUserUrl(path, qs(query));
    const options = await getUserOptions();

    return fetch(url, options)
        .then(async (res) => {
            const json = await res.json();
            if (json.error) {
                throw json;
            }

            return json;
        })
        .catch((e: ApiUserError) => {
            throw e.error.message;
        });
};

export const getFriends = async (
    userid: string,
    offset = 0,
    prevFriends: string[] = [],
): Promise<string[]> => {
    const res = await apiUserFetch<ApiFriends>(`${userid}/friends/profiles2`, {
        offset,
        limit: FRIENDS_LIMIT,
    });

    const { profiles, size, totalResults } = res;

    const friends = prevFriends.concat(profiles.map((p) => p.onlineId));

    if (size + prevFriends.length < totalResults) {
        return await getFriends(userid, (offset += FRIENDS_LIMIT), friends);
    }

    return friends;
};

export const getCurrentOnlineId = (userid: string): Promise<string> =>
    apiUserFetch<ApiProfile2>(`${userid}/profile2`).then(
        ({ profile }) => profile.currentOnlineId,
    );
