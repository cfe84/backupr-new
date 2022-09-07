import { Media } from "../entities/Media";
import { IMediaStore } from "./IMediaStore";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { Logger } from "../config/Logger";

export interface FileMediaStoreConfig {
  root: string,
  conflictBehavior: "keep" | "replace"
}

export class FileMediaStore<T> implements IMediaStore<T> {
  constructor(private config: FileMediaStoreConfig, private logger: Logger) {

  }

  async getMediaContent(media: Media<T>): Promise<Buffer> {
    const relativeFilePath = this.getMediaFilePath(media)
    const absoluteFilePath = path.join(this.config.root, relativeFilePath)
    return fs.readFileSync(absoluteFilePath)
  }

  private getFolderForMedia(media: Media<T>): string {
    return path.join(new Date(media.takenDate).getFullYear().toString())
  }

  private getFilenameForMedia(media: Media<T>): string {
    if (!media.originalName) {
      media.originalName = media.takenDate + "-" + media.title + (media.type === "photo" ? ".jpg" : ".mp4");
    }
    if (media.originalName.length > 64) {
      media.originalName = media.originalName.substring(0, 64);
    }
    media.originalName = media.originalName.replace(/[\/<>:"\[\]|?*]/g, "_")
    return `${new Date(media.takenDate).toISOString().substring(0, 10)}-${media.id}-${media.originalName}`
  }

  private download(fromUrl: string, target: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        https.get(fromUrl, (res) => {
          if (!res.statusCode || res.statusCode > 399) {
            reject(Error(`Got status code ${res.statusCode} while downloading ${fromUrl}`))
          }
          const file = fs.createWriteStream(target)
          res.pipe(file)
          file.on("finish", () => {
            file.close()
            resolve()
          })
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  private getMediaFilePath(media: Media<T>): string {
    const relativeFolder = this.getFolderForMedia(media)
    const relativeFilePath = path.join(relativeFolder, this.getFilenameForMedia(media))
    return relativeFilePath
  }

  async downloadMedia(media: Media<T>): Promise<string> {
    const relativeFolder = this.getFolderForMedia(media)
    const absoluteFolder = path.join(this.config.root, relativeFolder)
    fs.mkdirSync(absoluteFolder, { recursive: true })
    const relativeFilePath = this.getMediaFilePath(media)
    const absoluteFilePath = path.join(this.config.root, relativeFilePath)

    if (fs.existsSync(absoluteFilePath)) {
      if (this.config.conflictBehavior === "replace"){
        this.logger.warn(`File existed and was removed: '${absoluteFilePath}'`)
        fs.unlinkSync(absoluteFilePath)
      } else {
        this.logger.warn(`File existed and was kept: '${absoluteFilePath}'`)
        return relativeFilePath;
      }
    }
    try {
      await this.download(media.url, absoluteFilePath)
    } catch (err) {
      throw err
    }

    return relativeFilePath
  }
}