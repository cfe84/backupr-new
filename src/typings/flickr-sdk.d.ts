declare module "flickr-sdk" {
  namespace Flickr {
    class Test {
      login(): Promise<void>
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
      body: { oauth_token: OauthToken, oauth_token_secret: OauthTokenSecret }
    }

    export class OAuth {
      constructor(consumerKey: string, consumerSecret: string)
      static createPlugin(consumerKey: string, consumerSecret: string, oauthToken: string, oauthTokenSecret: string): OAuth
      request(callbackUrl: string): Promise<TokenBody>
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
  }

  export = Flickr;
}