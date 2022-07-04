import { BaseEntity, PrimaryColumn, Entity, In } from "typeorm";

@Entity()
export class Dodgy extends BaseEntity {
    @PrimaryColumn()
    psn: string;

    static async get(friends: string[]): Promise<string[]> {
        const dodgy = await this.find({ where: { psn: In(friends) } });

        return dodgy.map(({ psn }) => psn);
    }
}
