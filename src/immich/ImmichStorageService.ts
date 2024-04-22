import superagent, { SuperAgentRequest } from "superagent";
import { Media } from "../entities/Media";
import { MediaSet } from "../entities/MediaSet";
import { IStorageService } from "../services/IStorageService";
import { ImmichConfig } from "./ImmichConfig";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../config/Logger";

export class ImmichStorageService implements IStorageService {
  constructor(private storageLocation: string, private config: ImmichConfig, private logger: Logger) { }

  private createRequest(url: string): SuperAgentRequest {
    return superagent.post(url)
      .accept("application/json")
      .set("x-api-key", this.config.token);
  }

  async loginAsync(): Promise<void> {
    const url = `${this.config.apiUrl}/auth/validateToken`;
    const res = await this.createRequest(url);
    if (res.statusCode !== 201 || res.body.authStatus !== true) {
      throw Error(`Connection failed with status ${res.statusCode}: ${res.body}`);
    }
    this.logger.debug(`Immich: Token validation success`);
  }

  async uploadMediaAsync(media: Media<any>): Promise<string> {
    this.logger.debug(`Immich: uploading ${media.title}`);
    const uploadUrl = `${this.config.apiUrl}/asset/upload`;
    const filePath = path.join(this.storageLocation, "media", media.location);
    if (!fs.existsSync(filePath)) {
      throw Error(`File doesn't exist: ${filePath}`);
    }
    const res = await this.createRequest(uploadUrl)
      .set("Content-Type", "multipart/form-data")
      .attach("assetData", filePath)
      .field("deviceAssetId", media.id)
      .field("deviceId", "flickr")
      .field("fileCreatedAt", new Date(media.takenDate).toISOString())
      .field("fileModifiedAt", new Date(media.uploadDate).toISOString())
      .field("isFavorite", false);
    if (res.statusCode !== 201 || !res.body.id) {
      if (res.body.duplicate === true) {
        throw Error(`duplicate:${res.body.id}`);
      }
      this.logger.error(res.body);
      throw Error(`Error uploading ${media.title} (http ${res.statusCode}): ${res.body.error}`);
    }
    const id = res.body.id;
    this.logger.debug(`Immich: upload success, id: ${id}`);
    try {
      const updateUrl = `${this.config.apiUrl}/asset/${id}`
      const resUpdate = await superagent.put(updateUrl)
        .accept("application/json")
        .set("x-api-key", this.config.token)
        .set("Content-Type", "application/json")
        .send({
          tagIds: [],
          originalFileName: media.originalName,
          isFavorite: false,
          isArchived: false,
          description: media.title,
        });
      if (resUpdate.statusCode !== 200 || !res.body.id) {
        this.logger.error(res.body);
        throw Error(`Error uploading ${media.title} (http ${res.statusCode}): ${res.body.error}`);

      }
      this.logger.debug(`Immich: update success for id: ${id}`);
    } catch (err: any) {
      this.logger.error(`Immich: Error updating: ${err.message}`);
    }

    return id;
  }

  async createMediaSet(mediaSet: MediaSet<any>, primaryMediaExternalId: string, mediaExternalIds: string[]): Promise<string> {
    this.logger.debug(`Immich: creating album ${mediaSet.name}`);
    const createUrl = `${this.config.apiUrl}/album`;
    const createRes = await this.createRequest(createUrl)
      .set("Content-Type", "application/json")
      .send({
        albumName: mediaSet.name,
        albumThumbnailAssetId: primaryMediaExternalId,
        assetIds: mediaExternalIds,
      });
    if (createRes.statusCode !== 201 || !createRes.body.id) {
      throw Error(`Error creating album ${mediaSet.name}: ${createRes.body.error}`);
    }
    const id = createRes.body.id;

    return id;
  }

}