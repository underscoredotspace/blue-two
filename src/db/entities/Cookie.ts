import {
    Entity,
    Column,
    PrimaryColumn,
    BaseEntity,
    Timestamp,
    LessThan,
} from "typeorm";
import { Response } from "node-fetch";
import * as cookie from "cookie";
import { DateTime } from "luxon";

const expectedKeys = ["Domain", "Path", "Expires", "Max-Age"];

const getCookieName = (cookie: Record<string, unknown>) =>
    `${
        Object.keys(cookie).filter((key) => !expectedKeys.includes(key))[0] ??
        ""
    }`;

@Entity()
export class Cookie extends BaseEntity {
    @PrimaryColumn()
    name: string;

    @Column()
    value: string;

    @Column("datetime")
    expires: Timestamp;

    static store(res: Response): Promise<Cookie[]> {
        const cookies = res.headers
            .raw()
            ["set-cookie"].map((c) => cookie.parse(c));

        return Promise.all(
            cookies.map((c) => {
                const name = getCookieName(c);

                return Cookie.save({
                    name,
                    value: `${c[name]}`,
                    expires: DateTime.fromHTTP(c["Expires"]).toJSDate(),
                });
            }),
        );
    }

    static async retrieve(): Promise<string> {
        await this.delete({ expires: LessThan(Date.now()) });
        const cookies = await this.find();
        return cookies
            .map((cookie) => `${cookie.name}: ${cookie.value}`)
            .join(";");
    }
}
