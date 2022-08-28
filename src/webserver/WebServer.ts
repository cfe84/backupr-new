import Express from "express";
import { Logger } from "../config/Logger";

export class WebServer {
  private app: Express.Express;
  constructor(private port: number, private logger: Logger) {
    this.app = Express();

    this.index = this.index.bind(this);

    this.app.get("/", this.index);
  }

  public start() {
    this.app.listen(this.port);
  }

  public index(req: Express.Request, res: Express.Response){
    res.write("yes!\n" + this.logger.getLogs().join("\n"));
    res.end();
  }
}