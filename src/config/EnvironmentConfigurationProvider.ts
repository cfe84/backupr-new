import { FlickrClientCredentials, FlickrToken } from "../flickr/FlickClientCredentials";

export class EnvironmentConfigurationProvider {

  getClientCredentials(): FlickrClientCredentials {
    return { key: process.env.KEY || "", secret: process.env.SECRET || "" }
  }

  getToken(): FlickrToken | undefined {
    if (!process.env.OAUTH_TOKEN || !process.env.OAUTH_TOKEN_SECRET) {
      return undefined
    }
    return {
      oauth_token: process.env.OAUTH_TOKEN,
      oauth_token_secret: process.env.OAUTH_TOKEN_SECRET,
    }
  }
}