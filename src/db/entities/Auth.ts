import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm";
import { NewToken } from "~/psn/types";

export enum TokenType {
    REFRESH = "npsso",
    ACCESS = "access_token",
}

@Entity()
export class Auth extends BaseEntity {
    @PrimaryColumn()
    type: TokenType;

    @Column()
    token: string;

    @Column()
    expires: Date;

    static getToken(type: TokenType): Promise<Auth | null> {
        return this.findOne({ where: { type } });
    }

    static async newToken(token: NewToken): Promise<void> {
        if (token.type === TokenType.REFRESH) {
            const VALID_REFRESH = /^[A-Z0-9]{64}$/i;
            if (!VALID_REFRESH.test(token.token)) {
                throw "Token must be 64 characters, letters (upper or lower case) and numbers only.";
            }
        } else {
            const VALID_ACCESS = /^[a-z0-9-]{36}$/;

            if (!VALID_ACCESS.test(token.token)) {
                throw "Token must be 36 characters, letters, numbers and hyphens only.";
            }
        }

        await this.save(token as Auth);
    }
}
