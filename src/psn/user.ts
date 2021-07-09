import fetch from "node-fetch";
import { qs } from "~/helpers";

interface ApiUser {
    onlineId: string;
}

interface ApiFriends {
    profiles: ApiUser[];
    start: number;
    size: number;
    totalResults: number;
}

interface ApiProfile2 {
    profile: ApiUser & { currentOnlineId: string };
}

interface ApiError {
    error: {
        code: number;
        message: string;
    };
}

const apiUrl = (path: string, qs?: {}) =>
    `https://nl-prof.np.community.playstation.net/userProfile/v1/users/${path}${
        qs ? `?${qs}` : ""
    }`;

const apiFetch = <T>(path: string, query?: {}): Promise<T> => {
    return fetch(apiUrl(path, qs(query)))
        .then((res) => res.json())
        .catch(({ error }: ApiError) => {
            throw new Error(error.message);
        });
};

const FRIENDS_LIMIT = 500;

export const getFriends = async (
    userid: string,
    offset = 0,
    prevFriends: string[] = [],
): Promise<string[]> => {
    const { profiles, size, totalResults } = await apiFetch<ApiFriends>(
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
    apiFetch<ApiProfile2>(`${userid}/profile2`).then(
        ({ profile }) => profile.currentOnlineId,
    );
