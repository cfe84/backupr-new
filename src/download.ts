import * as dotenv from "dotenv"
dotenv.config()

import { FlickrMedia, FlickrPhotoset } from "flickr-sdk";
import { exit } from "process";
import { EnvironmentConfigurationProvider } from "./config/EnvironmentConfigurationProvider";
import { FlickrFacade } from "./flickr/FlickrFacade"
import { Downloader } from "./processor/Downloader";
import { FileMediaLibrary } from "./mediaLibrary/FileMediaLibrary";
import { FileMediaStore, FileMediaStoreConfig } from "./mediaLibrary/FileMediaStore";
import path from "path";
import { Logger } from "./config/Logger";

const configurationProvider = new EnvironmentConfigurationProvider()

const logger = new Logger("debug")
const token = configurationProvider.getToken()
const facade = new FlickrFacade(configurationProvider.getClientCredentials(), token, logger);
const storePath = configurationProvider.getStore()
if (!storePath) {
  console.error(`Add REPOSITORY= to your env`)
  exit(1)
}
const library = FileMediaLibrary.load<FlickrMedia, FlickrPhotoset>(storePath)
const storeConfig: FileMediaStoreConfig = {
  root: path.join(storePath, "media"),
  conflictBehavior: configurationProvider.getConflictBehavior()
};
const store = new FileMediaStore(storeConfig, logger);

async function run() {
  const login = () => {
    facade.loginAsync().then(token => {
      console.log(`Add this to your env and come back:
OAUTH_TOKEN=${token.oauth_token}
OAUTH_TOKEN_SECRET=${token.oauth_token_secret}
NSID=${token.user_nsid}
`)
      return;
    })
  }

  if (!await facade.isLoggedInAsync()) {
    login()
  } else {
    const processor = new Downloader(facade, library, store, logger)
    await processor.process()
  }
}
run().finally()