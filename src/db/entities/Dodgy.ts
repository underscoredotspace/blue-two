import { BaseEntity, PrimaryColumn, Entity, In } from "typeorm";

@Entity()
export class Dodgy extends BaseEntity {
    @PrimaryColumn()
    psn: string;

    static async checkMany(friends: string[]): Promise<string[]> {
        const dodgy = await this.find({
            where: { psn: In(friends) },
        });

        console.log("dodgy", dodgy);

        return (dodgy ?? []).map(({ psn }) => psn);
    }

    static async checkOne(psn: string): Promise<boolean> {
        const dodgy = await this.findOne({ where: { psn } });

        return Boolean(dodgy);
    }
}
