import { Media } from "../entities/Media";
import { IMediaStore } from "./IMediaStore";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { resolve } from "path";
import { rejects } from "assert";
import { Logger } from "../config/Logger";

export class FileMediaStore<T> implements IMediaStore<T> {
  constructor(private root: string, private logger: Logger) {

  }

  private getFolderForMedia(media: Media<T>): string {
    return path.join(new Date(media.takenDate).getFullYear().toString())
  }

  private getFilenameForMedia(media: Media<T>): string {
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

  async downloadMedia(media: Media<T>): Promise<string> {
    const relativeFolder = this.getFolderForMedia(media)
    const absoluteFolder = path.join(this.root, relativeFolder)
    fs.mkdirSync(absoluteFolder, { recursive: true })
    const relativeFilePath = path.join(relativeFolder, this.getFilenameForMedia(media))
    const absoluteFilePath = path.join(this.root, relativeFilePath)

    if (fs.existsSync(absoluteFilePath)) {
      this.logger.warn(`File existed and was removed: '${absoluteFilePath}'`)
      fs.unlinkSync(absoluteFilePath)
    }
    await this.download(media.url, absoluteFilePath)

    return relativeFilePath
  }
}