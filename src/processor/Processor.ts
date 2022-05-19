import { FlickrMedia } from "flickr-sdk";
import { FlickrFacade } from "../flickr/FlickrFacade";
import { Store } from "./Store";

export class Processor {
  constructor(private flickr: FlickrFacade, private store: Store<FlickrMedia>) {

  }

  async process() {
    await this.syncMediaList()
  }

  private async syncMediaList() {
    console.log(`### Sync media list ###`)
    const maxUploadDate = this.store.getMaxUploadDate()
    const mediaList = await this.flickr.listMedia(maxUploadDate)
    const missingMedia = mediaList.filter(media => this.store.getMedia(media.id) === undefined)
    await this.store.addMedias(missingMedia)
  }
}