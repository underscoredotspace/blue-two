import fetch, { Headers } from "node-fetch";
import { getAccess } from "~/auth";
import { qs } from "~/helpers";
import { USER_URL, FRIENDS_LIMIT } from "./constants";
import { ApiError, ApiFriends, ApiProfile2 } from "./types";

export const apiUrl = (path: string, qs?: string) =>
    `${USER_URL}/${path}${qs ? `?${qs}` : ""}`;

export const userAuthHeader = async () =>
    new Headers({
        Authorization: `Bearer ${await getAccess()}`,
    });

export const apiUserFetch = <T>(path: string, query?: {}): Promise<T> =>
    fetch(apiUrl(path, qs(query)))
        .then((res) => res.json())
        .catch((e: ApiError) => Promise.reject(e.error.message));

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

export const getCurrentOnlineId = (userid: string) =>
    apiUserFetch<ApiProfile2>(`${userid}/profile2`).then(
        ({ profile }) => profile.currentOnlineId,
    );
