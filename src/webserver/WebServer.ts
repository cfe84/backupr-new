import Express from "express";
import { Logger } from "../config/Logger";

export class WebServer {
  private app: Express.Express;
  constructor(private port: number, private logger: Logger) {
    this.app = Express();

    this.index = this.index.bind(this);

    this.app.get("/", this.index);
    this.app.get("/keep-alive", this.keepAlive);
  }

  public start() {
    this.app.listen(this.port);
  }

  public index(req: Express.Request, res: Express.Response) {
    res.write("Logs:\n" + this.logger.getLogs().reverse().join("\n"));
    res.end();
  }

  public keepAlive(req: Express.Request, res: Express.Response) {
    res.end("alive");
  }
}