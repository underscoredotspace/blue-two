import express from "express";
const server = express();

server.get("/friends/:userid", (req, res) => {
    const { userid } = req.params;

    res.json({ userid });
});

server.listen(3002);
