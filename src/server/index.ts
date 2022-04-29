import express from "express";
import { saveRefresh } from "~/auth";
import { env } from "~/helpers";
import { getCurrentOnlineId, getFriends } from "~/psn";
const server = express();

server.use(express.json());

server.get("/friends/:userid", async (req, res) => {
    const { userid } = req.params;
    // validate userid?

    try {
        const friends = await getFriends(userid);
        res.json({ friends });
    } catch (error) {
        res.status(500).send(error);
    }
});

server.get("/current-id/:userid", async (req, res) => {
    const { userid } = req.params;
    // validate userid?

    try {
        const currentOnlineId = await getCurrentOnlineId(userid);
        res.json({ currentOnlineId });
    } catch (error) {
        res.status(500).send(error);
    }
});

server.post("/save-refresh", async (req, res) => {
    const { npsso } = req.body;
    if (!npsso) {
        return res.sendStatus(400); // bad request
    }

    await saveRefresh(npsso)
        .then(() => res.sendStatus(200))
        .catch((error) => res.status(500).send(error));
});

server.listen(env.PORT).once("listening", () => {
    console.log(`Express started on port ${env.PORT}`);
});
