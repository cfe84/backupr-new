import * as fs from "fs"
import * as path from "path"
import { Media } from "../entities/Media"

type Dictionary<T> = { [key: string]: T }

export class Store<T> {
  static load<T>(storePath: string): Store<T> {
    const mediaFile = path.join(storePath, "media.json")
    let media = {}
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath)
    } else if (fs.existsSync(mediaFile)) {
      media = JSON.parse(fs.readFileSync(mediaFile).toString())
    }
    return new Store(media, mediaFile)
  }
  private constructor(private mediaList: Dictionary<Media<T>>, private mediaFile: string) {

  }

  private async saveMediaList() {
    fs.writeFileSync(this.mediaFile, JSON.stringify(this.mediaList, null, 2))
  }

  async addMedia(media: Media<T>) {
    this.mediaList[media.id] = media
    await this.saveMediaList()
  }

  async addMedias(medias: Media<T>[]) {
    medias.forEach((media) => {
      this.mediaList[media.id] = media
    })
    await this.saveMediaList()
  }

  getMedia(id: string): Media<T> | undefined {
    return this.mediaList[id]
  }

  getUnuploadedMedia() {
    return Object.values(this.mediaList).filter(media => !media.downloaded)
  }

  getMaxUploadDate(): number | undefined {
    if (Object.values(this.mediaList).length === 0) {
      return undefined
    }
    return Math.max(...Object.values(this.mediaList).map(media => media.uploadDate))
  }
}