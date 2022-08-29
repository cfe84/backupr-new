import * as fs from "fs"
import * as fsAsync from "fs/promises"
import * as path from "path"
import { Media } from "../entities/Media"
import { MediaSet } from "../entities/MediaSet"
import { IMediaLibrary } from "./IMediaLibrary"

type Dictionary<T> = { [key: string]: T }

export class FileMediaLibrary<TMedia, TMediaSet> implements IMediaLibrary<TMedia, TMediaSet> {
  static load<TMedia, TMediaSet>(storePath: string): FileMediaLibrary<TMedia, TMediaSet> {
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
    return new FileMediaLibrary(media, mediaFile, tmpMediaFile, mediasets, mediaSetFile, tmpMediaSetFile)
  }

  private constructor(private mediaList: Dictionary<Media<TMedia>>,
    private mediaFile: string,
    private tmpMediaFile: string,
    private mediaSetList: Dictionary<MediaSet<TMediaSet>>,
    private mediaSetFile: string,
    private tmpMediaSetFile: string) {
  }

  private async saveMediaListAsync() {
    await fsAsync.writeFile(this.tmpMediaFile, JSON.stringify(this.mediaList, null, 2))
    await fsAsync.rename(this.tmpMediaFile, this.mediaFile);
  }

  private async saveMediaSetListAsync() {
    await fsAsync.writeFile(this.tmpMediaSetFile, JSON.stringify(this.mediaSetList, null, 2))
    await fsAsync.rename(this.tmpMediaSetFile, this.mediaSetFile);
  }

  async updateMediaAsync(media: Media<TMedia>) {
    await this.saveMediaListAsync();
  }

  async addMedia(media: Media<TMedia>) {
    this.mediaList[media.id] = media
    await this.saveMediaListAsync()
  }

  async addMedias(medias: Media<TMedia>[]) {
    medias.forEach((media) => {
      this.mediaList[media.id] = media
    })
    await this.saveMediaListAsync()
  }

  async getMediaAsync(id: string): Promise<Media<TMedia> | undefined> {
    return this.mediaList[id]
  }

  async getMediaWithNoHashAsync(): Promise<Media<TMedia>[]> {
    return Object.values(this.mediaList).filter(media => !media.hash)
  }

  async getUnuploadedMedia(): Promise<Media<TMedia>[]> {
    return Object.values(this.mediaList).filter(media => !media.downloaded)
  }

  async getMaxUploadDate(): Promise<number | undefined> {
    if (Object.values(this.mediaList).length === 0) {
      return undefined
    }
    return Math.max(...Object.values(this.mediaList).map(media => media.uploadDate))
  }

  async addMediaSetsAsync(mediaSets: MediaSet<TMediaSet>[]) {
    mediaSets.forEach(mediaSet => {
      this.mediaSetList[mediaSet.id] = mediaSet
    })
    await this.saveMediaSetListAsync()
  }

  async updateMediaSetAsync(mediaSet: MediaSet<TMediaSet>) {
    await this.saveMediaSetListAsync()
  }

  async getMediaSets(): Promise<MediaSet<TMediaSet>[]> {
    return Object.values(this.mediaSetList)
  }

  async getOutdatedMediasetsAsync(): Promise<MediaSet<TMediaSet>[]> {
    return (await this.getMediaSets()).filter(set => set.contentAsOf !== set.lastUpdate)
  }
}