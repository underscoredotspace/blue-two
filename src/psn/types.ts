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

export interface ApiAuthAccess {
    access_token: string;
    expires_in: number;
}

export interface ApiUserError {
    error: {
        message: string;
    };
}

export interface ApiAuthError {
    error: string;
    error_description: string;
}

export interface NewToken {
    token: string;
    expires: Date;
    type: TokenType;
}
