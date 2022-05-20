import download from "download";
import { FlickrMedia, FlickrPhotoset } from "flickr-sdk";
import { FlickrFacade } from "../flickr/FlickrFacade";
import { IMediaStore } from "./IMediaStore";
import { MediaLibrary } from "./MediaLibrary";

export class Processor {
  constructor(private flickr: FlickrFacade, private library: MediaLibrary<FlickrMedia, FlickrPhotoset>, private store: IMediaStore<FlickrMedia>) {

  }

  async process() {
    // await this.syncMediaList()
    // await this.addVideoOriginalUrls()
    // await this.addOriginalName()
    // await this.downloadMissingMedia()

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
    console.log(`### Download missing media ###`)
    const missingMedia = this.library.getUnuploadedMedia()
    let i = 0
    for (let media of missingMedia) {
      try {
        console.log(`Downloading ${i++}/${missingMedia.length} ${media.originalName} (${media.title} - ${media.id})`)
        media.location = await this.store.downloadMedia(media)
        media.downloaded = true
        await this.library.saveMediaList()
      }
      catch (err) {
        console.error(`Got error ${err} while downloading ${media.id} (${media.title})`)
      }
    }
  }

  private async addOriginalName() {
    for (let media of this.library.getUnuploadedMedia().filter(media => !media.originalName)) {
      media.originalName = this.getOriginalName(media.title, media.type, media.url)
    }
    await this.library.saveMediaList()
  }

  private async addVideoOriginalUrls() {
    console.log(`### Adding video urls ###`)
    for (let media of this.library.getUnuploadedMedia().filter((media) => media.type === "video" && media.url === "")) {
      try {
        media.url = await this.flickr.getOriginalVideoUrl(media.id, media.record.secret)
      } catch (err) {
        console.error(`Failed to retrieve url for id: ${media.id}, name: ${media.title}`)
        continue
      }
    }
    await this.library.saveMediaList()
  }

  private async syncMediaList() {
    console.log(`### Sync media list ###`)
    const maxUploadDate = this.library.getMaxUploadDate()
    const mediaList = await this.flickr.listMedia(maxUploadDate)
    const missingMedia = mediaList.filter(media => this.library.getMedia(media.id) === undefined)
    await this.library.addMedias(missingMedia)
  }

  private async syncAlbums() {
    // Todo: sync only missing?
    console.log(`### Sync media list ###`)
    const sets = await this.flickr.listSets()
    this.library.addMediaSets(sets)
  }

  private async syncAlbumContent() {
    console.log(`### Sync media set content ###`)
    const sets = this.library.getMediaSets().filter(set => set.mediaIds.length === 0)
    let i = 0
    for (let set of sets) {
      console.log(`${i++} / ${sets.length}: ${set.name}`)
      try {
        const content = await this.flickr.listPhotosInSet(set.record.id)
        set.mediaIds = content.map(content => content.id)
        await this.library.saveMediaSetList()
      }
      catch (err) {
        console.error(`Error while retrieving content of set ${set.name} (${set.id}): ${(err as Error).message}`)
        continue
      }
    }
  }
}