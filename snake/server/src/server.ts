import express from "express";
import path from "path";
import { SnakeGame, Action } from "./utils";
import config from './train_config.json'
const app = express();
const port = 3000;
const clientDist = path.resolve("../client/dist");
const modelsDir = path.resolve(config.savePath);
const game = new SnakeGame(9, 9, 1, 2);
console.log(game, Action)

app.use(express.static(modelsDir));
app.use(express.static(clientDist));
app.get("/", (req, res) => {
  res.sendFile(clientDist + "/game.html");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
