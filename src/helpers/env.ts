import { log } from "console";
import { config } from "dotenv";

interface Environment {
    PSN_PASSWORD: string;
    POSTGRES: string;
    DEV: boolean;
}

const env = {
    ...config().parsed,
    DEV: process.env.NODE_ENV !== "production",
} as unknown as Environment;

const required: (keyof Environment | null)[] = [
    "PSN_PASSWORD",
    env.DEV ? null : "POSTGRES",
];

const missing = required.filter((key) => key && !env[key]);

if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(0);
}

export default env;
