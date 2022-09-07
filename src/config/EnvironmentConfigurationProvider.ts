import { FlickrClientCredentials, FlickrToken } from "../flickr/FlickClientCredentials";

export class EnvironmentConfigurationProvider {

  getClientCredentials(): FlickrClientCredentials {
    return { key: process.env.KEY || "", secret: process.env.SECRET || "" }
  }

  getToken(): FlickrToken | undefined {
    if (!process.env.OAUTH_TOKEN || !process.env.OAUTH_TOKEN_SECRET || !process.env.NSID) {
      return undefined
    }
    return {
      oauth_token: process.env.OAUTH_TOKEN,
      oauth_token_secret: process.env.OAUTH_TOKEN_SECRET,
      nsid: process.env.NSID,
    }
  }

  getStore(): string | undefined {
    return process.env.REPOSITORY
  }

  getPort(): number {
    return Number.parseInt(process.env.PORT || "8080")
  }

  getConflictBehavior(): "replace" | "keep" {
    return process.env.CONFLICT_BEHAVIOR === "keep" ? "keep" : "replace"
  }
}