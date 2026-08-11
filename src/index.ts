import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routs";
import notFound from "./middleware/notfound";
import cors from 'cors'
import multer from 'multer'
import cookieParser from 'cookie-parser';
import helmet from "helmet";
import globalErrorHandler from "./middleware/globalErrorhandler";
import { DefaultTask } from "./utils/DefaultTask";
import "./workers/index"

dotenv.config();

const app: Express = express();

multer();
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(cors({
  origin: ["https://admin.milo22.cloud", "https://www.admin.milo22.cloud", "http://localhost:5005"],
  credentials: true
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.get("/", (req: Request, res: Response) => {
  res.send("-------------------- 🎇 Server running 🎇 -------------------------");
});

DefaultTask();

app.use("/api", router);

app.use(notFound);

app.use(globalErrorHandler);


// app.listen(port, () => {
//   console.log(`[server]: Server is running at ${config.ip + ":" + port}`);
// });

export default app;
