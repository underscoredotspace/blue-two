import express from "express";
import { DateTime, Duration } from "luxon";
import { getAccess, getRefresh, nearExpiry, saveRefresh } from "~/auth";
import { Dodgy } from "~/db/entities";
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
        res.status(500).json({ error });
    }
});

server.get("/check/:userid", async (req, res) => {
    const { userid } = req.params;
    // validate userid?

    try {
        const friends = await getFriends(userid);
        const dodgy = await Dodgy.get(friends);

        res.json({ friends, dodgy });
    } catch (error) {
        res.status(500).json({ error });
    }
});

server.get("/current-id/:userid", async (req, res) => {
    const { userid } = req.params;
    // validate userid?

    try {
        const currentOnlineId = await getCurrentOnlineId(userid);
        res.json({ currentOnlineId });
    } catch (error) {
        res.status(500).json({ error });
    }
});

server.get("/check-refresh", async (_req, res) => {
    try {
        const refresh = await getRefresh();
        res.json({ nearExpiry: nearExpiry(refresh), expires: refresh.expires });
    } catch (error) {
        res.status(500).json({ error });
    }
});

server.get("/check-access", async (_req, res) => {
    try {
        const access = await getAccess();
        res.json({ nearExpiry: nearExpiry(access), expires: access.expires });
    } catch (error) {
        res.status(500).json({ error });
    }
});

server.post("/save-refresh", async (req, res) => {
    const { npsso, expires_in } = req.body;
    if (!npsso || !expires_in) {
        return res
            .status(400)
            .json({ error: "'npsso' and 'expires_in' required" }); // bad request
    }

    if (Number.isNaN(Number(expires_in))) {
        return res.status(400).json({ error: "'expires_in' is invalid" }); // bad request
    }

    const expires = DateTime.utc().plus(
        Duration.fromObject({ seconds: Number(expires_in) }),
    );

    await saveRefresh(npsso, expires)
        .then(() => res.sendStatus(200))
        .catch((error) => res.status(500).json({ error }));
});

const PORT = env.PORT ?? 3002;

server.listen(PORT).once("listening", () => {
    console.log(`Express started on port ${PORT}`);
});
