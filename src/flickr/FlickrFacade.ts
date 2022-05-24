import Flickr, { FlickrMedia, FlickrPhotoInSet, FlickrPhotoset } from "flickr-sdk";
import * as http from "http";
import { parse } from "url";
import { Logger } from "../config/Logger";
import { Media, MediaType } from "../entities/Media";
import { MediaSet } from "../entities/MediaSet";
import { FlickrClientCredentials, FlickrToken } from "./FlickClientCredentials";
import { FlickrRequester, FlickrStreams } from "./FlickrRequester";

export class FlickrFacade {
  private flickr: Flickr | undefined
  private requester: FlickrRequester | undefined
  constructor(private config: FlickrClientCredentials, private token: FlickrToken | undefined, private logger: Logger) {
    if (token) {
      this.flickr = new Flickr(Flickr.OAuth.createPlugin(config.key, config.secret, token.oauth_token, token.oauth_token_secret))
      this.requester = new FlickrRequester(config, token)
    }
  }

  async loginAsync() {
    const listenToAnswer = (): Promise<string> => {
      return new Promise((resolve) => {
        const server = http.createServer(function (req, res) {
          var url = parse(req.url as string, true);
          res.write("You can close that tab now.");
          res.end();
          server.close();
          return resolve(url.query.oauth_verifier as string);
        }).listen(3000);
      });
    };

    const oauth = new Flickr.OAuth(this.config.key, this.config.secret);
    const res = await oauth.request("http://localhost:3000/");
    const { oauth_token, oauth_token_secret } = res.body;
    this.logger.log(`Go to this URL and authorize the application: ${oauth.authorizeUrl(oauth_token, "delete")}`);
    const verifier = await listenToAnswer();
    const verifyRes = await oauth.verify(oauth_token, verifier, oauth_token_secret);
    const token = verifyRes.body;
    return token;
  }

  async isLoggedInAsync(): Promise<boolean> {
    if (!this.flickr) {
      return false
    }
    try {
      await this.flickr.test.login()
    } catch (er) {
      this.logger.error(er)
      return false
    }
    return true
  }

  async getVideoOriginalName(id: string, secret: string): Promise<any> {
    if (!this.token || !this.flickr) {
      throw Error(`Called getInfo without authentication`)
    }
    const info = await this.flickr.photos.getInfo({ photo_id: id, secret: secret })
    const photo = info.body.photo
    return `${photo.title._content}.${photo.originalformat}`
  }

  async getOriginalVideoUrl(id: string, secret: string): Promise<string> {
    if (!this.requester || !this.token) {
      throw Error(`Called getOriginalVideoUrl without authentication`)
    }
    const streams = await this.requester?.get<FlickrStreams>(FlickrRequester.methods.flickr_video_getStreamInfo, { photo_id: id, secret: secret })
    const original = streams.streams.stream.find((stream: any) => stream.type === "orig")
    if (!original) {
      throw Error(`Missing video original`)
    }
    return original._content
  }

  async listMedia(minDate?: number): Promise<Media<FlickrMedia>[]> {
    if (!this.flickr || !this.token) {
      throw Error(`Called listMedia without authentication`)
    }
    if (!!minDate) {
      minDate = minDate / 1000 // Flickr takes dates / 1000
    }
    let pageCount = 1
    let media: FlickrMedia[] = []
    while (true) {
      const page = (await this.flickr.people.getPhotos({ user_id: this.token.nsid, page: pageCount, extras: "url_o,date_upload,date_taken,media", min_upload_date: minDate })).body
      media = media.concat(page.photos.photo)
      this.logger.debug(`Retrieved media page ${page.photos.page} / ${page.photos.pages}, containing ${page.photos.total} photos`)
      if (page.photos.page >= page.photos.pages) {
        break;
      }
      pageCount++
    }

    return media.map(media => ({
      id: media.id,
      title: media.title,
      type: media.media,
      record: media,
      downloaded: false,
      url: (media.media === "photo" ? media.url_o : ""), // video url is not included in the metadata
      uploadDate: Number.parseInt(media.dateupload) * 1000,
      takenDate: media.datetaken ? new Date(media.datetaken).getTime() : Number.parseInt(media.dateupload) * 1000,
      originalName: "",
      location: "",
      errors: []
    }))
  }

  async listSets(): Promise<MediaSet<FlickrPhotoset>[]> {
    if (!this.flickr || !this.token) {
      throw Error(`Called listSets without authentication`)
    }
    let pageCount = 1
    let sets: FlickrPhotoset[] = []
    while (true && pageCount < 10) {
      const page = (await this.flickr.photosets.getList({ page: pageCount })).body
      sets = sets.concat(page.photosets.photoset)
      this.logger.debug(`Retrieved sets page ${page.photosets.page} / ${page.photosets.pages}`)
      if (pageCount >= page.photosets.pages) {
        break;
      }
      pageCount++
    }

    return sets.map(set => ({
      description: set.description._content,
      id: set.id,
      mediaIds: [],
      name: set.title._content,
      record: set,
      primaryPhotoId: set.primary,
      contentAsOf: 0,
      lastUpdate: Number.parseInt(set.date_update) * 1000
    }))
  }

  async listPhotosInSet(setId: string): Promise<FlickrPhotoInSet[]> {
    if (!this.flickr || !this.token) {
      throw Error(`Called listPhotosInSet without authentication`)
    }
    let pageCount = 1
    let photos: FlickrPhotoInSet[] = []
    while (true) {
      const params = { user_id: this.token.nsid, photoset_id: setId, page: pageCount };
      const page = (await this.flickr.photosets.getPhotos(params)).body
      photos = photos.concat(page.photoset.photo)
      if (pageCount >= page.photoset.pages) {
        break;
      }
      pageCount++
    }

    return photos
  }
}