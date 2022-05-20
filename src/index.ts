import * as dotenv from "dotenv"
import { FlickrMedia } from "flickr-sdk";
import { exit } from "process";
import { EnvironmentConfigurationProvider } from "./config/EnvironmentConfigurationProvider";
import { FlickrFacade } from "./flickr/FlickrFacade"
import { Processor } from "./processor/Processor";
import { Store } from "./processor/Store";
dotenv.config()
import { FlickrRequester } from "./flickr/FlickrRequester";

type Dictionary = { [key: string]: string }
const configurationProvider = new EnvironmentConfigurationProvider()

const token = configurationProvider.getToken()
const facade = new FlickrFacade(configurationProvider.getClientCredentials(), token);
const storePath = configurationProvider.getStore()
if (!storePath) {
  console.error(`Add REPOSITORY= to your env`)
  exit(1)
}
const store = Store.load<FlickrMedia>(storePath)

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
    const processor = new Processor(facade, store)
    await processor.process()
  }
}
run().finally()