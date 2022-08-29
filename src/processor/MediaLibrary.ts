import * as fs from "fs"
import * as fsAsync from "fs/promises"
import * as path from "path"
import { Media } from "../entities/Media"
import { MediaSet } from "../entities/MediaSet"

type Dictionary<T> = { [key: string]: T }

export class MediaLibrary<TMedia, TMediaSet> {
  static load<TMedia, TMediaSet>(storePath: string): MediaLibrary<TMedia, TMediaSet> {
    const mediaFile = path.join(storePath, "media.json")
    const tmpMediaFile = path.join(storePath, "tmp-media.json")
    let media = {}
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath)
    } else if (fs.existsSync(mediaFile)) {
      media = JSON.parse(fs.readFileSync(mediaFile).toString())
    }

    const mediaSetFile = path.join(storePath, "mediasets.json")
    const tmpMediaSetFile = path.join(storePath, "tmp-mediasets.json")
    let mediasets = {}
    if (fs.existsSync(mediaSetFile)) {
      mediasets = JSON.parse(fs.readFileSync(mediaSetFile).toString())
    }
    return new MediaLibrary(media, mediaFile, tmpMediaFile, mediasets, mediaSetFile, tmpMediaSetFile)
  }
  private constructor(private mediaList: Dictionary<Media<TMedia>>,
    private mediaFile: string,
    private tmpMediaFile: string,
    private mediaSetList: Dictionary<MediaSet<TMediaSet>>,
    private mediaSetFile: string,
    private tmpMediaSetFile: string) {

  }

  public async saveMediaList() {
    await fsAsync.writeFile(this.tmpMediaFile, JSON.stringify(this.mediaList, null, 2))
    await fsAsync.rename(this.tmpMediaFile, this.mediaFile);
  }
  public async saveMediaSetList() {
    await fsAsync.writeFile(this.tmpMediaSetFile, JSON.stringify(this.mediaSetList, null, 2))
    await fsAsync.rename(this.tmpMediaSetFile, this.mediaSetFile);
  }

  async addMedia(media: Media<TMedia>) {
    this.mediaList[media.id] = media
    await this.saveMediaList()
  }

  async addMedias(medias: Media<TMedia>[]) {
    medias.forEach((media) => {
      this.mediaList[media.id] = media
    })
    await this.saveMediaList()
  }

  getMedia(id: string): Media<TMedia> | undefined {
    return this.mediaList[id]
  }

  async getMediaWithNoHashAsync(): Promise<Media<TMedia>[]> {
    return Object.values(this.mediaList).filter(media => !media.hash)
  }

  getUnuploadedMedia() {
    return Object.values(this.mediaList).filter(media => !media.downloaded)
  }

  async getMaxUploadDate(): Promise<number | undefined> {
    if (Object.values(this.mediaList).length === 0) {
      return undefined
    }
    return Math.max(...Object.values(this.mediaList).map(media => media.uploadDate))
  }

  async addMediaSets(mediaSets: MediaSet<TMediaSet>[]) {
    mediaSets.forEach(mediaSet => {
      this.mediaSetList[mediaSet.id] = mediaSet
    })
    await this.saveMediaSetList()
  }

  async getMediaSets(): Promise<MediaSet<TMediaSet>[]> {
    return Object.values(this.mediaSetList)
  }

  async getOutdatedMediasetsAsync(): Promise<MediaSet<TMediaSet>[]> {
    return (await this.getMediaSets()).filter(set => set.contentAsOf !== set.lastUpdate)
  }
}