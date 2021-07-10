import { TokenType } from "~/db/entities/Auth";

export interface ApiUser {
    onlineId: string;
}

export interface ApiFriends {
    profiles: ApiUser[];
    start: number;
    size: number;
    totalResults: number;
}

export interface ApiProfile2 {
    profile: ApiUser & { currentOnlineId: string };
}

export interface ApiError {
    error: {
        code: number;
        message: string;
    };
}

export interface NewToken {
    token: string;
    expires: Date;
    type: TokenType;
}
