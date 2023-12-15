import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";
import path from "path";
import bodyParser from "body-parser";
import { TrainOptions, train } from "./train";
import { SnakeGameAgent } from "./agent";
import { SnakeGame } from "./game";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const server = http.createServer(app);

const port = 3000;
const clientDist = path.resolve("../client/dist");
const modelsDir = path.resolve("./models/dqn");

app.use(express.static(modelsDir));
app.use(express.static(clientDist));

const main = async (options: TrainOptions) => {
  const game = new SnakeGame(
    options.game.height,
    options.game.width,
    options.game.food,
    options.game.snake
  );

  const agent = new SnakeGameAgent(
    game,
    options.replay_buffer_size,
    options.epsilon.init,
    options.epsilon.final,
    options.epsilon.decay_frames,
    options.learning_rate
  );

  await train(
    agent,
    options.batch_size,
    options.gamma,
    options.learning_rate,
    options.sync_every_frames,
    options.thresholds.cumulative_reward,
    options.thresholds.max_frames,
    options.version
  );
};

app.get("/", (req, res) => {
  res.sendFile(clientDist + "/game.html");
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

let is_busy = false

io.on("connection", (socket: Socket) => {
  console.log("CLIENT CONNECTED");

  socket.on("disconnect", () => {
    console.log("CLIENT DISCONNECTED");
  });

  socket.on("train", (options: TrainOptions) => {
    if(!is_busy) {
      const game = new SnakeGame(
        options.game.height,
        options.game.width,
        options.game.food,
        options.game.snake
      );
          
      const agent = new SnakeGameAgent(
        game,
        options.replay_buffer_size,
        options.epsilon.init,
        options.epsilon.final,
        options.epsilon.decay_frames,
        options.learning_rate
      );
    
      train(
        agent,
        options.batch_size,
        options.gamma,
        options.learning_rate,
        options.sync_every_frames,
        options.thresholds.cumulative_reward,
        options.thresholds.max_frames,
        options.version
      ).finally(() => {
        is_busy = false
      })
      is_busy = true
    }
  });
});
