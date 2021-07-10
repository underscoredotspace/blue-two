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

    static getToken(type: TokenType): Promise<Auth | undefined> {
        return this.findOne({ where: { type } });
    }

    static async newToken(token: NewToken): Promise<void> {
        await this.save(token as Auth);
    }
}
