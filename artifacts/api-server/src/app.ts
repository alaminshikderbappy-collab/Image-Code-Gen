import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttpLib from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

// This line fixes the "pinoHttp is not a function" crash
const pinoHttp = (pinoHttpLib as any).default || pinoHttpLib;

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
