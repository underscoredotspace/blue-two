import { TokenType } from "~/db/entities/Auth";
import { NewToken } from "./types";

export const renewAccess = async (): Promise<NewToken> => {
    return { token: "", expires: new Date(), type: TokenType.ACCESS };
};

export const renewRefresh = async (): Promise<NewToken> => {
    return { token: "", expires: new Date(), type: TokenType.REFRESH };
};
