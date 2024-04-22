import { FlickrClientCredentials, FlickrToken } from "../flickr/FlickClientCredentials";
import { ImmichConfig } from "../immich/ImmichConfig";

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

  getStore(): string {
    const repository = process.env.REPOSITORY;
    if (!repository) {
      throw Error("No REPOSITORY defined in environment");
    }
    return repository;
  }

  getPort(): number {
    return Number.parseInt(process.env.PORT || "8080")
  }

  getConflictBehavior(): "replace" | "keep" {
    return process.env.CONFLICT_BEHAVIOR === "keep" ? "keep" : "replace"
  }

  getStorageService(): "immich" | undefined {
    const service = process.env.STORAGE_SERVICE;
    if (["immich", undefined].indexOf(service) < 0) {
      throw Error(`Invalid STORAGE_SERVICE: ${service}`);
    }
    return service as any;
  }

  getImmichConfig(): ImmichConfig {
    if (!process.env.IMMICH_API || !process.env.IMMICH_TOKEN) {
      throw Error("Missing Immich config in environment (IMMICH_API and IMMICH_TOKEN)")
    }
    return {
      apiUrl: process.env.IMMICH_API,
      token: process.env.IMMICH_TOKEN,
    }
  }
}