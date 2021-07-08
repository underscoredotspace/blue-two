import { Entity, Column, PrimaryColumn, BaseEntity } from "typeorm";

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
}
