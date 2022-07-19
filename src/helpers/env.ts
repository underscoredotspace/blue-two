import { config } from "dotenv";

interface Environment {
    PSN_PASSWORD: string;
    POSTGRES: string;
    PORT?: number;
    DEV: boolean;
}

const env = {
    ...process.env,
    ...config().parsed,
    DEV: process.env.NODE_ENV !== "production",
} as unknown as Environment;

const required: (keyof Environment | null)[] = [
    // "PSN_PASSWORD",
    // "PORT",
    env.DEV ? null : "POSTGRES",
];

const missing = required.filter((key) => key && !env[key]);

if (process.env.NODE_ENV !== "test" && missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    process.exit(0);
}

export default env;
