import { Connection, ConnectionOptions, getConnectionManager } from "typeorm";
import { env } from "~/helpers";
import * as entities from "./entities";

const forEnvironment = env.DEV
    ? {
          type: "sqlite",
          database: "./data/blue-two.sqlite",
      }
    : {
          type: "postgres",
          url: env.POSTGRES,
      };

const options = {
    ...forEnvironment,
    name: "default",
    entities: Object.values(entities),
    logging: false,
    synchronize: true,
} as ConnectionOptions;

export async function ensureConnection(): Promise<Connection> {
    const connectionManager = getConnectionManager();

    if (connectionManager.has("default")) {
        const connection = connectionManager.get("default");

        if (!connection.isConnected) {
            await connection.connect();
        }

        return connection;
    }

    return await connectionManager
        .create(options as ConnectionOptions)
        .connect();
}
