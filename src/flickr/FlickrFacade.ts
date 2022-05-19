import Flickr from "flickr-sdk";
import * as http from "http";
import { parse } from "url";
import { FlickrClientCredentials, FlickrToken } from "./FlickClientCredentials";


export class FlickrFacade {
  private flickr: Flickr | undefined
  constructor(private config: FlickrClientCredentials, private token: FlickrToken | undefined) {
    if (token) {
      this.flickr = new Flickr(Flickr.OAuth.createPlugin(config.key, config.secret, token.oauth_token, token.oauth_token_secret))
      // this.flickr = Flickr(config.key)
    }
  }

  async loginAsync() {
    const listenToAnswer = (): Promise<string> => {
      return new Promise((resolve) => {
        const server = http.createServer(function (req, res) {
          var url = parse(req.url as string, true);
          res.write("You can close that tab now.");
          res.end();
          server.close();
          return resolve(url.query.oauth_verifier as string);
        }).listen(3000);
      });
    };

    const oauth = new Flickr.OAuth(this.config.key, this.config.secret);
    const res = await oauth.request("http://localhost:3000/");
    const { oauth_token, oauth_token_secret } = res.body;
    console.log(`Go to this URL and authorize the application: ${oauth.authorizeUrl(oauth_token, "delete")}`);
    const verifier = await listenToAnswer();
    const verifyRes = await oauth.verify(oauth_token, verifier, oauth_token_secret);
    const token = verifyRes.body;
    return token;
  }

  async isLoggedInAsync(): Promise<boolean> {
    if (!this.flickr) {
      return false
    }
    try {
      await this.flickr.test.login()
    } catch (er) {
      console.error(er)
      return false
    }
    return true
  }
}