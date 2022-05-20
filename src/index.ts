import * as dotenv from "dotenv"
import { FlickrMedia, FlickrMediaList, FlickrPhotoset } from "flickr-sdk";
import { exit } from "process";
import { EnvironmentConfigurationProvider } from "./config/EnvironmentConfigurationProvider";
import { FlickrFacade } from "./flickr/FlickrFacade"
import { Processor } from "./processor/Processor";
import { MediaLibrary } from "./processor/MediaLibrary";
dotenv.config()
import { FlickrRequester } from "./flickr/FlickrRequester";
import { FileMediaStore } from "./processor/FileMediaStore";
import path from "path";

const configurationProvider = new EnvironmentConfigurationProvider()

const token = configurationProvider.getToken()
const facade = new FlickrFacade(configurationProvider.getClientCredentials(), token);
const storePath = configurationProvider.getStore()
if (!storePath) {
  console.error(`Add REPOSITORY= to your env`)
  exit(1)
}
const library = MediaLibrary.load<FlickrMedia, FlickrPhotoset>(storePath)
const store = new FileMediaStore(path.join(storePath, "media"))

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
    const processor = new Processor(facade, library, store)
    await processor.process()
  }
}
run().finally()