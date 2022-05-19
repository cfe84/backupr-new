declare module "flickr-sdk" {
  namespace Flickr {

    interface ResultWithBody<T> {
      body: T
    }

    class Test {
      login(): Promise<void>
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

    interface GetPhotosParameter {
      user_id: string
      page?: number,
      extras?: string,
      min_upload_date?: number
    }

    class People {
      getPhotos(nsid: GetPhotosParameter): Promise<ResultWithBody<FlickrMediaList>>
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
  }

  export = Flickr;
}