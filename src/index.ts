import * as dotenv from "dotenv"
import { EnvironmentConfigurationProvider } from "./config/EnvironmentConfigurationProvider";
import { FlickrFacade } from "./flickr/FlickrFacade"
dotenv.config()

const configurationProvider = new EnvironmentConfigurationProvider()

const token = configurationProvider.getToken()
const facade = new FlickrFacade(configurationProvider.getClientCredentials(), token);

async function run() {
  const login = () => {
    facade.loginAsync().then(token => {
      console.log(`Add this to your env and come back:
  OAUTH_TOKEN: ${token.oauth_token}
  OAUTH_TOKEN_SECRET: ${token.oauth_token_secret}`)
      return;
    })
  }

  if (!await facade.isLoggedInAsync()) {
    login()
  } else {
    console.log("Hurray")
  }
}
run().finally()