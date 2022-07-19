import "module-alias/register";
import { ensureConnection } from "./db";
// import { Dodgy } from "./db/entities";

ensureConnection().then(() => import("./server"));
// .then(() => {
//     Dodgy.checkOne("sioqn").then(console.log);
//     Dodgy.checkMany(["spoopymee", "sioqn"]).then(console.log);
// });
