import download from "download";
import { FlickrMedia, FlickrPhotoset } from "flickr-sdk";
import { Logger } from "../config/Logger";
import { FlickrFacade } from "../flickr/FlickrFacade";
import { IMediaStore } from "./IMediaStore";
import { MediaLibrary } from "./MediaLibrary";

export class Processor {
  constructor(private flickr: FlickrFacade,
    private library: MediaLibrary<FlickrMedia, FlickrPhotoset>,
    private store: IMediaStore<FlickrMedia>,
    private logger: Logger) {

  }

  async process() {
    await this.syncMediaList()
    await this.addVideoOriginalUrls()
    await this.addOriginalName()
    await this.downloadMissingMedia()

    // await this.syncAlbums()
    // await this.syncAlbumContent()
  }

  private getOriginalName(title: string, type: string, downloadUrl: string) {
    const url = new URL(downloadUrl)
    const index = url.pathname.lastIndexOf(".")
    const extension = index >= 0 ? url.pathname.substring(index) : type === "video" ? ".mp4" : ".jpg"
    return title + extension
  }

  private async downloadMissingMedia() {
    this.logger.log(`### Download missing media ###`)
    const missingMedia = this.library.getUnuploadedMedia().filter(media => media.originalName && media.url)
    let i = 0
    for (let media of missingMedia) {
      try {
        this.logger.log(`Downloading ${i++}/${missingMedia.length} ${media.originalName} (${media.title} - ${media.id})`)
        media.location = await this.store.downloadMedia(media)
        media.downloaded = true
        await this.library.saveMediaList()
      }
      catch (err) {
        this.logger.error(`Got error ${err} while downloading ${media.id} (${media.title})`)
      }
    }
  }

  private async addOriginalName() {
    for (let media of this.library.getUnuploadedMedia().filter(media => !media.originalName && media.url)) {
      media.originalName = this.getOriginalName(media.title, media.type, media.url)
    }
    await this.library.saveMediaList()
  }

  private async addVideoOriginalUrls() {
    this.logger.log(`### Adding video urls ###`)
    for (let media of this.library.getUnuploadedMedia().filter((media) => media.type === "video" && media.url === "")) {
      try {
        media.url = await this.flickr.getOriginalVideoUrl(media.id, media.record.secret)
      } catch (err) {
        this.logger.error(`Failed to retrieve url for id: ${media.id}, name: ${media.title}: ${(err as Error).message}`)
        continue
      }
    }
    await this.library.saveMediaList()
  }

  private async syncMediaList() {
    this.logger.log(`### Sync media list ###`)
    const maxUploadDate = this.library.getMaxUploadDate()
    const mediaList = await this.flickr.listMedia(maxUploadDate)
    const missingMedia = mediaList.filter(media => this.library.getMedia(media.id) === undefined)
    await this.library.addMedias(missingMedia)
  }

  private async syncAlbums() {
    // Todo: sync only missing?
    this.logger.log(`### Sync media list ###`)
    const sets = await this.flickr.listSets()
    this.library.addMediaSets(sets)
  }

  private async syncAlbumContent() {
    this.logger.log(`### Sync media set content ###`)
    const sets = this.library.getMediaSets().filter(set => set.mediaIds.length === 0)
    let i = 0
    for (let set of sets) {
      this.logger.debug(`${i++} / ${sets.length}: ${set.name}`)
      try {
        const content = await this.flickr.listPhotosInSet(set.record.id)
        set.mediaIds = content.map(content => content.id)
        await this.library.saveMediaSetList()
      }
      catch (err) {
        this.logger.error(`Error while retrieving content of set ${set.name} (${set.id}): ${(err as Error).message}`)
        continue
      }
    }
  }
}