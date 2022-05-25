import express from "express";
import { DateTime, Duration } from "luxon";
import { getAccess, getRefresh, nearExpiry, saveRefresh } from "~/auth";
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

server.get("/check-refresh", async (req, res) => {
    try {
        const refresh = await getRefresh();
        res.json({ nearExpiry: nearExpiry(refresh), expires: refresh.expires });
    } catch (error) {
        res.status(500).send(error);
    }
});

server.get("/check-access", async (req, res) => {
    try {
        const access = await getAccess();
        res.json({ nearExpiry: nearExpiry(access), expires: access.expires });
    } catch (error) {
        res.status(500).send(error);
    }
});

server.post("/save-refresh", async (req, res) => {
    const { npsso, expires_in } = req.body;
    if (!npsso || !expires_in) {
        return res.status(400).send("'npsso' and 'expires_in' required"); // bad request
    }

    if (Number.isNaN(Number(expires_in))) {
        return res.status(400).send("'expires_in' is invalid"); // bad request
    }

    const expires = DateTime.utc().plus(
        Duration.fromObject({ seconds: Number(expires_in) }),
    );

    await saveRefresh(npsso, expires)
        .then(() => res.sendStatus(200))
        .catch((error) => res.status(500).send(error));
});

server.listen(env.PORT).once("listening", () => {
    console.log(`Express started on port ${env.PORT}`);
});
