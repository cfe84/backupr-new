import * as fs from "fs"
import * as path from "path"
import { Media } from "../entities/Media"
import { MediaSet } from "../entities/MediaSet"

type Dictionary<T> = { [key: string]: T }

export class MediaLibrary<TMedia, TMediaSet> {
  static load<TMedia, TMediaSet>(storePath: string): MediaLibrary<TMedia, TMediaSet> {
    const mediaFile = path.join(storePath, "media.json")
    let media = {}
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath)
    } else if (fs.existsSync(mediaFile)) {
      media = JSON.parse(fs.readFileSync(mediaFile).toString())
    }

    const mediaSetFile = path.join(storePath, "mediasets.json")
    let mediasets = {}
    if (fs.existsSync(mediaSetFile)) {
      mediasets = JSON.parse(fs.readFileSync(mediaSetFile).toString())
    }
    return new MediaLibrary(media, mediaFile, mediasets, mediaSetFile)
  }
  private constructor(private mediaList: Dictionary<Media<TMedia>>,
    private mediaFile: string,
    private mediaSetList: Dictionary<MediaSet<TMediaSet>>,
    private mediaSetFile: string) {

  }

  public async saveMediaList() {
    fs.writeFileSync(this.mediaFile, JSON.stringify(this.mediaList, null, 2))
  }
  public async saveMediaSetList() {
    fs.writeFileSync(this.mediaSetFile, JSON.stringify(this.mediaSetList, null, 2))
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

  getAllMedia() {
    return Object.values(this.mediaList)
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

  async addMediaSets(mediaSets: MediaSet<TMediaSet>[]) {
    mediaSets.forEach(mediaSet => {
      this.mediaSetList[mediaSet.id] = mediaSet
    })
    await this.saveMediaSetList()
  }

  getMediaSets(): MediaSet<TMediaSet>[] {
    return Object.values(this.mediaSetList)
  }
}