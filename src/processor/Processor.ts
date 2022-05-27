import { FlickrMedia, FlickrPhotoset } from "flickr-sdk";
import { Logger } from "../config/Logger";
import { Media, MediaProcessError } from "../entities/Media";
import { FlickrFacade } from "../flickr/FlickrFacade";
import { IMediaStore } from "./IMediaStore";
import { MediaLibrary } from "./MediaLibrary";
import { dHash } from "dhashjs"

const forbiddenChars = new RegExp("[\/><:\\\\|?*]", "g")

const errorCodes = {
  VIDEO_URL: "VIDEO_URL_FETCH_ERROR",
  RETRIEVE_FROM_STORAGE: "RETRIEVE_FROM_STORAGE_ERROR",
  CALCULATE_PICTURE_HASH: "CALCULATE_PICTURE_HASH_ERROR"
}

type AsyncExecutor = () => Promise<void>

export class Processor {
  constructor(private flickr: FlickrFacade,
    private library: MediaLibrary<FlickrMedia, FlickrPhotoset>,
    private store: IMediaStore<FlickrMedia>,
    private logger: Logger) {

  }

  async process() {
    await this.syncMediaList()
    await this.downloadMissingMedia()
    await this.syncAlbums()
    await this.syncAlbumContent()
    await this.hashMedia()
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

  private async executeWithErrorProtection(media: Media<FlickrMedia>, errorCode: string, executor: AsyncExecutor): Promise<boolean> {
    const error = this.getErrorOfType(media, errorCode)
    if (error.count >= 3) {
      this.logger.warn(`Skipped ${media.id} for ${errorCode} as it failed ${error.count} times`);
      return false
    }
    try {
      await executor()
      return true
    } catch (err) {
      error.message = (err as Error).message
      error.count++
      this.addError(media, error)
      this.logger.error(`Failed execution ${error.count} times on ${errorCode} from ${media.id}: ${error.message}`)
      return false
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

  private async addVideoOriginalUrl(media: Media<FlickrMedia>): Promise<boolean> {
    return await this.executeWithErrorProtection(media, errorCodes.VIDEO_URL, async () => {
      media.url = await this.flickr.getOriginalVideoUrl(media.id, media.record.secret)
    })
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

  private async syncMediaList() {
    this.logger.log(`### Sync media list ###`)
    const maxUploadDate = this.library.getMaxUploadDate()
    this.logger.debug(`Taking everything uploaded after ${maxUploadDate ? new Date(maxUploadDate) : 'beginning of time'}`)
    const mediaList = await this.flickr.listMedia(maxUploadDate)
    const missingMedia = mediaList.filter(media => this.library.getMedia(media.id) === undefined)
    await this.library.addMedias(missingMedia)
  }

  private async syncAlbums() {
    this.logger.log(`### Sync media list ###`)
    const sets = await this.flickr.listSets()
    const mediaSetsInStore = await this.library.getMediaSets()
    // Update existing sets
    sets.forEach(media => {
      const setInStore = mediaSetsInStore.find(setInStore => setInStore.id === media.id)
      if (setInStore && setInStore.lastUpdate !== media.lastUpdate) {
        this.logger.debug(`Media set '${setInStore.name}' changed, saving new lastUpdate.`)
        setInStore.lastUpdate = media.lastUpdate
      }
    })
    const missingSets = sets.filter(set => mediaSetsInStore.find(setInStore => setInStore.id === set.id) === undefined)
    this.logger.debug(`Adding ${missingSets.length} missing sets`)
    if (missingSets.length !== 0) {
      await this.library.addMediaSets(missingSets)
    } else {
      await this.library.saveMediaSetList()
    }
  }

  private async syncAlbumContent() {
    this.logger.log(`### Sync media set content ###`)
    const sets = this.library.getMediaSets().filter(set => set.contentAsOf !== set.lastUpdate)
    let i = 0
    for (let set of sets) {
      this.logger.debug(`Updating media set ${i++} / ${sets.length} '${set.name}'`)
      try {
        const content = await this.flickr.listPhotosInSet(set.record.id)
        set.mediaIds = content.map(content => content.id)
        set.contentAsOf = set.lastUpdate
        await this.library.saveMediaSetList()
      }
      catch (err) {
        this.logger.error(`Error while retrieving content of set ${set.name} (${set.id}): ${(err as Error).message}`)
        continue
      }
    }
  }

  private async hashMedia() {
    this.logger.log(`### Calculate media hash ###`)
    const mediaMissingHash = this.library.getAllMedia().filter(media => !media.hash)
    let i = 0
    for (let media of mediaMissingHash) {
      if (media.type === "photo") {
        this.logger.debug(`Calculating hash for photo ${i++}/${mediaMissingHash.length}`)
        let content: Buffer
        if (await this.executeWithErrorProtection(media, errorCodes.RETRIEVE_FROM_STORAGE, async () => { content = await this.store.getMediaContent(media) }) &&
          await this.executeWithErrorProtection(media, errorCodes.CALCULATE_PICTURE_HASH, async () => { media.hash = await dHash.calculateHashAsync(content) })) {
          this.library.saveMediaList()
        }
      }
    }
  }
}