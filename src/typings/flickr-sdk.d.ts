declare module "flickr-sdk" {
  namespace Flickr {

    interface ResultWithBody<T> {
      body: T
    }

    interface Content {
      _content: string
    }

    interface GetStreamInfoParameters {
      photo_id: string,
      secret?: string
    }

    class Test {
      login(): Promise<void>
    }

    interface GetPhotosetsListParameters {
      page: number
    }

    interface FlickrPhotoset {
      id: string,
      title: Content,
      description: Content,
    }

    interface FlickrPhotosets {
      photosets: {
        photoset: FlickrPhotoset[]
        page: number
        pages: number
      }
    }

    interface FlickrPhotoInSet {
      id: string,
      secret: string,
      title: string,
      isPrimary: boolean
    }

    interface FlickrPhotosetPhotos {
      photoset: {
        photo: [],
        page: number,
        pages: number
      }
    }

    interface GetPhotosetsPhotosParameters {
      photoset_id: string,
      page: number
    }

    class Photosets {
      getList(params: GetPhotosetsListParameters): Promise<ResultWithBody<FlickrPhotosets>>
      getPhotos(params: GetPhotosetsPhotosParameters): Promise<ResultWithBody<FlickrPhotosetPhotos>>
    }

    interface FlickrMedia {
      id: string,
      owner: string,
      secret: string,
      server: string
      farm: number,
      title: string,
      url_o: string,
      dateupload: string,
      datetaken: string,
      media: "photo" | "video",
      ispublic: 0 | 1,
      isfriend: 0 | 1,
      isfamily: 0 | 1
    }

    class FlickrMediaList {
      photos: {
        page: number,
        pages: number,
        perpage: number,
        total: number,
        photo: FlickrMedia[]
      }
    }

    interface GetPeoplePhotosParameter {
      user_id: string
      page?: number,
      extras?: string,
      min_upload_date?: number
    }

    class People {
      getPhotos(nsid: GetPeoplePhotosParameter): Promise<ResultWithBody<FlickrMediaList>>
    }

    interface FlickrSize {
      label: string,
      width: number,
      height: number,
      source: string,
      url: string,
      media: "photo" | "video"
    }

    interface FlickrSizeList {
      sizes: {
        canblog: 0 | 1,
        canprint: 0 | 1,
        candownload: 0 | 1,
        size: FlickrSize[]
      }
    }

    interface GetSizesParameters {
      photo_id: string
    }

    interface GetInfoParameters {
      photo_id: string,
      secret?: string
    }

    interface FlickrInfo {
      "photo": {
        "id": string,
        "secret": string,
        "server": string,
        "farm": number,
        "dateuploaded": string,
        "isfavorite": 0 | 1,
        "license": string,
        "safety_level": string,
        "rotation": number,
        "originalsecret": string,
        "originalformat": string,
        "owner": {
          "nsid": string,
          "username": string,
          "realname": string,
          "location": string,
          "iconserver": string,
          "iconfarm": number,
          "path_alias": string
        },
        "title": {
          "_content": string
        },
        "description": {
          "_content": string
        },
        "visibility": {
          "ispublic": 0 | 1,
          "isfriend": 0 | 1,
          "isfamily": 0 | 1
        },
        "dates": {
          "posted": string,
          "taken": string,
          "takengranularity": number,
          "takenunknown": string,
          "lastupdate": string
        },
        "permissions": {
          "permcomment": number,
          "permaddmeta": number
        },
        "views": string,
        "editability": {
          "cancomment": 0 | 1,
          "canaddmeta": 0 | 1
        },
        "publiceditability": {
          "cancomment": 0 | 1,
          "canaddmeta": 0 | 1
        },
        "usage": {
          "candownload": 0 | 1,
          "canblog": 0 | 1,
          "canprint": 0 | 1,
          "canshare": 0 | 1
        },
        "comments": {
          "_content": string
        },
        "notes": {
          "note": []
        },
        "people": {
          "haspeople": 0 | 1
        },
        "tags": {
          "tag": []
        },
        "urls": {
          "url": [
            {
              "type": string,
              "_content": string
            }
          ]
        },
        "media": "video" | "photo",
        "video": {
          "ready": 1 | 0,
          "failed": 0 | 1,
          "pending": 0 | 1,
          "duration": string,
          "width": number,
          "height": number
        }
      },
      "stat": "ok"
    }

    class Photos {
      getSizes(parameters: GetSizesParameters): Promise<ResultWithBody<FlickrSizeList>>
      getInfo(parameters: GetInfoParameters): Promise<ResultWithBody<FlickrInfo>>
    }


    interface FlickrOauthToken {
      fullname: string,
      oauth_token: string,
      oauth_token_secret: string,
      user_nsid: string,
      username: string
    }
    type OauthToken = string;
    type OauthTokenSecret = string;
    interface VerifyResponse {
      body: FlickrOauthToken
    }
    interface TokenBody {
      oauth_token: OauthToken, oauth_token_secret: OauthTokenSecret
    }

    export class OAuth {
      constructor(consumerKey: string, consumerSecret: string)
      static createPlugin(consumerKey: string, consumerSecret: string, oauthToken: string, oauthTokenSecret: string): OAuth
      request(callbackUrl: string): Promise<ResultWithBody<TokenBody>>
      authorizeUrl(token: OauthToken, permissions: "delete" | "read" | "write"): string
      verify(token: OauthToken, verifier: string, secret: OauthTokenSecret): Promise<VerifyResponse>
    }

    type ApiKey = string
    type Auth = OAuth | ApiKey
  }

  function Flickr(auth: Flickr.Auth): Flickr

  class Flickr {
    constructor(auth: Flickr.Auth)
    test: Flickr.Test
    people: Flickr.People
    photos: Flickr.Photos
    photosets: Flickr.Photosets
  }

  export = Flickr;
}