import Flickr, { FlickrMedia } from "flickr-sdk";
import * as http from "http";
import { parse } from "url";
import { Media, MediaType } from "../entities/Media";
import { FlickrClientCredentials, FlickrToken } from "./FlickClientCredentials";
import { FlickrRequester, FlickrStreams } from "./FlickrRequester";

export class FlickrFacade {
  private flickr: Flickr | undefined
  private requester: FlickrRequester | undefined
  constructor(private config: FlickrClientCredentials, private token: FlickrToken | undefined) {
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
    console.log(`Go to this URL and authorize the application: ${oauth.authorizeUrl(oauth_token, "delete")}`);
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
      console.error(er)
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
    let pageCount = 1
    let media: FlickrMedia[] = []
    while (true && pageCount < 15) {
      const page = (await this.flickr.people.getPhotos({ user_id: this.token.nsid, page: pageCount, extras: "url_o,date_upload,media", min_upload_date: minDate })).body
      media = media.concat(page.photos.photo)
      console.log(`Retrieved page ${page.photos.page} / ${page.photos.pages}`)
      if (page.photos.page === page.photos.pages) {
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
      url: media.url_o,
      uploadDate: Number.parseInt(media.dateupload),
      location: ""
    }))
  }
}