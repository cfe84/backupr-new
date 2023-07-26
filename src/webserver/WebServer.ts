import Express from "express";
import path from "path";
import { Logger } from "../config/Logger";
import basicAuth from "express-basic-auth";
import { IMediaLibrary } from "../mediaLibrary/IMediaLibrary";
import { IMediaStore } from "../mediaLibrary/IMediaStore";
import { FlickrMedia, FlickrPhotoset } from "flickr-sdk";
import { ApiResponse } from "./ApiResponse";
import { MediasetHeader } from "./dtos/MediasetHeader";
import { MediaSet } from "../entities/MediaSet";
import { AuthMiddleware } from "./AuthMiddleware";

export interface WebServerDeps {
  logger: Logger,
  mediaLibrary: IMediaLibrary<FlickrMedia, FlickrPhotoset>,
  mediaStore: IMediaStore<FlickrMedia>,
}

export class WebServer {
  private app: Express.Express;
  constructor(private port: number, private deps: WebServerDeps) {
    this.app = Express();

    const auth = new AuthMiddleware();
    this.app.use(Express.static(path.join(__dirname, "..", "static")));
    this.app.get("/keep-alive", this.keepAlive);
    this.getMediaSets = this.getMediaSets.bind(this);
    this.app.get("/api/mediasets", auth.authorize(), this.getMediaSets);
    this.getMediaSet = this.getMediaSet.bind(this);
    this.app.get("/api/mediasets/:id", auth.authorize(), this.getMediaSet);
  }

  public start() {
    this.app.listen(this.port, () => {
      this.deps.logger.log(`Started listening on port ${this.port}`);
    });
  }

  public keepAlive(req: Express.Request, res: Express.Response) {
    res.end("alive");
  }

  private async getMediaSets(req: Express.Request, res: Express.Response) {
    const sets = await this.deps.mediaLibrary.getMediaSets();
    const data: ApiResponse<MediasetHeader[]> = {
      data: sets.map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        primaryPhotoId: set.primaryPhotoId
      })),
      result: "success"
    };
    res.json(data);
    res.end();
  }

  private async getMediaSet(req: Express.Request, res: Express.Response) {
    const sets = await this.deps.mediaLibrary.getMediaSets();
    const setId = req.params["id"]
    const set = sets.find(set => set.id === setId);
    if (!set) {
      const response: ApiResponse<any> = {
        result: "error",
        error: `Not found`
      };
      res.statusCode = 404
      res.json(response)
    } else {
      const data: ApiResponse<MediaSet<any>> = {
        data: set,
        result: "success"
      };
      res.json(data);
    }
    res.end();
  }
}