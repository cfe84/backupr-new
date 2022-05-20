import download from "download";
import { FlickrMedia } from "flickr-sdk";
import { FlickrFacade } from "../flickr/FlickrFacade";
import { Store } from "./Store";

export class Processor {
  constructor(private flickr: FlickrFacade, private store: Store<FlickrMedia>) {

  }

  async process() {
    await this.syncMediaList()
    await this.downloadMissingMedia()
  }

  private getOriginalName(title: string, type: string, downloadUrl: string) {
    const url = new URL(downloadUrl)
    const index = url.pathname.lastIndexOf(".")
    const extension = index >= 0 ? url.pathname.substring(index) : type === "video" ? ".mp4" : ".jpg"
    return title + extension
  }

  private async downloadMissingMedia() {
    console.log(`### Download missing ###`)
    for (let media of this.store.getUnuploadedMedia()) {
      let originalName, url
      if (media.type === "video") {
        try {
          url = await this.flickr.getOriginalVideoUrl(media.id, media.record.secret)
        } catch (err) {
          console.error(`Failed to retrieve url for id: ${media.id}, name: ${originalName}`)
          return
        }
      } else if (media.type === "photo") {
        url = media.url
      } else {
        console.error(`Unknown media type: ${media.type}`)
        return
      }
      originalName = this.getOriginalName(media.title, media.type, url)
      console.log(`Download ${url} to ${originalName} (${media.title})`)
      // const res = await download(url)
      // console.log(res)
    }
  }

  private async syncMediaList() {
    console.log(`### Sync media list ###`)
    const maxUploadDate = this.store.getMaxUploadDate()
    const mediaList = await this.flickr.listMedia(maxUploadDate)
    const missingMedia = mediaList.filter(media => this.store.getMedia(media.id) === undefined)
    await this.store.addMedias(missingMedia)
  }
}