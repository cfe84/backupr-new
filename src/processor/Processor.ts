import download from "download";
import { FlickrMedia, FlickrPhotoset } from "flickr-sdk";
import { Logger } from "../config/Logger";
import { Media, MediaProcessError } from "../entities/Media";
import { FlickrFacade } from "../flickr/FlickrFacade";
import { IMediaStore } from "./IMediaStore";
import { MediaLibrary } from "./MediaLibrary";

const forbiddenChars = new RegExp("[\/><:\\\\|?*]", "g")

const errorCodes = {
  VIDEO_URL: "VIDEO_URL_FETCH_ERROR",

}

export class Processor {
  constructor(private flickr: FlickrFacade,
    private library: MediaLibrary<FlickrMedia, FlickrPhotoset>,
    private store: IMediaStore<FlickrMedia>,
    private logger: Logger) {

  }

  async process() {
    await this.syncMediaList()
    await this.downloadMissingMedia()

    // await this.syncAlbums()
    // await this.syncAlbumContent()
  }

  private getErrorOfType(media: Media<FlickrMedia>, errorCode: string): MediaProcessError {
    const newError = {
      code: errorCode,
      message: "",
      count: 0
    }
    if (!media.errors) {
      return newError
    }
    let error = media.errors.find(err => err.code === errorCode)
    if (!error) {
      return newError
    }
    return error
  }

  private async addError(media: Media<FlickrMedia>, error: MediaProcessError) {
    if (!media.errors) {
      media.errors = []
    }
    if (media.errors.indexOf(error) < 0) {
      media.errors.push(error)
    }
  }

  private getOriginalName(title: string, type: string, downloadUrl: string) {
    const url = new URL(downloadUrl)
    const index = url.pathname.lastIndexOf(".")
    const extension = index >= 0 ? url.pathname.substring(index) : type === "video" ? ".mp4" : ".jpg"
    title = title.replace(forbiddenChars, "_")
    return title + extension
  }

  private async downloadMissingMedia() {
    this.logger.log(`### Download missing media ###`)
    const missingMedia = this.library.getUnuploadedMedia()
    let i = 0
    for (let media of missingMedia) {
      this.logger.log(`Downloading ${i++}/${missingMedia.length} ${media.originalName} (${media.title} - ${media.id})`)
      if (media.type === "video" && !await this.addVideoOriginalUrl(media)) {
        continue
      }
      media.originalName = this.getOriginalName(media.title, media.type, media.url)
      await this.downloadMedia(media);
    }
  }

  private async downloadMedia(media: Media<FlickrMedia>) {
    try {
      media.location = await this.store.downloadMedia(media);
      media.downloaded = true;
      await this.library.saveMediaList();
    }
    catch (err) {
      this.logger.error(`Got error ${err} while downloading ${media.id} (${media.title})`);
    }
  }

  private async addVideoOriginalUrl(media: Media<FlickrMedia>): Promise<boolean> {
    const urlError = this.getErrorOfType(media, errorCodes.VIDEO_URL)
    if (urlError.count >= 3) {
      this.logger.warn(`Skipped ${media.id} as it consistently fails`);
      return false
    }
    try {
      media.url = await this.flickr.getOriginalVideoUrl(media.id, media.record.secret)
      return true
    } catch (err) {
      this.logger.error(`Failed to retrieve url for id: ${media.id}, name: ${media.title}: ${(err as Error).message}.`)
      urlError.message = (err as Error).message
      urlError.count++
      this.addError(media, urlError)
      return false
    }
  }

  private async syncMediaList() {
    this.logger.log(`### Sync media list ###`)
    const maxUploadDate = this.library.getMaxUploadDate()
    this.logger.debug(`Taking everything uploaded after ${maxUploadDate ? new Date(maxUploadDate) : 'beginning of time'}`)
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