import "module-alias/register";
import "./server";
import { ensureConnection } from "./db";
ensureConnection();
