import fetch, { RequestInit } from "node-fetch";
import { ParsedUrlQueryInput } from "querystring";
import { getAccess } from "~/auth";
import { qs } from "~/helpers";
import { USER_URL, FRIENDS_LIMIT } from "./constants";
import { ApiUserError, ApiFriends, ApiProfile2 } from "./types";

export const apiUserUrl = (path: string, qs?: string): string =>
    `${USER_URL}/${path}${qs ? `?${qs}` : ""}`;

export const getUserOptions = async (): Promise<RequestInit> => ({
    headers: { Authorization: `Bearer ${await getAccess()}` },
});

export const apiUserFetch = async <T>(
    path: string,
    query?: ParsedUrlQueryInput,
): Promise<T> =>
    fetch(apiUserUrl(path, qs(query)), await getUserOptions())
        .then((res) => res.json())
        .catch((e: ApiUserError) => Promise.reject(e.error.message));

export const getFriends = async (
    userid: string,
    offset = 0,
    prevFriends: string[] = [],
): Promise<string[]> => {
    const { profiles, size, totalResults } = await apiUserFetch<ApiFriends>(
        `${userid}/friends/profiles2`,
        {
            offset,
            limit: FRIENDS_LIMIT,
        },
    );

    const friends = profiles.map((p) => p.onlineId);

    if (size + prevFriends.length < totalResults) {
        return await getFriends(userid, (offset += FRIENDS_LIMIT), [
            ...prevFriends,
            ...friends,
        ]);
    }

    return [...prevFriends, ...friends];
};

export const getCurrentOnlineId = (userid: string): Promise<string> =>
    apiUserFetch<ApiProfile2>(`${userid}/profile2`).then(
        ({ profile }) => profile.currentOnlineId,
    );
