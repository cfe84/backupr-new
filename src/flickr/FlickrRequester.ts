import crypto from "crypto";
import { FlickrClientCredentials, FlickrToken } from "./FlickClientCredentials";
import * as superagent from "superagent"

type Dictionary = { [key: string]: string }
var chars: { [key: string]: string } = {
  '!': '%21',
  '\'': '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A'
};

const regex = new RegExp('[' + Object.keys(chars).join('') + ']', 'g');

const methods = {
  flickr_video_getStreamInfo: "flickr.video.getStreamInfo"
}

/**
 * Custom requester for any flickr API method. Mainly added for missing methods in flickr-sdk
 */
export class FlickrRequester {
  constructor(private creds: FlickrClientCredentials, private token?: FlickrToken) {
  }

  static methods = methods

  /**
   * Sorts, flattens to a query string, escapes using the expected escaping alg
   * @param params Query parameters
   * @returns 
   */
  private flattenParams(params: Dictionary) {
    return Object.keys(params).sort().map(key => `${key}=${this.encodeRFC3986(params[key])}`).join("&")
  }

  /**
   * Calculates HMAC signature for OAuth1
   * @param verb GET/POST/...
   * @param url Base url for flickr. Most likely https://api.flickr.com/services/rest
   * @param params Query parameters
   * @returns OAuth1 signature in a string form. NEEDS TO BE ESCAPED
   */
  private calcSignature(verb: string, url: string, params: Dictionary) {
    // Base url is METHOD + URL + Sorted list of query parameters, joined with "&"
    // Each of these three encoded as URI component
    const baseUrl = `${verb.toUpperCase()}&${this.encodeRFC3986(url)}&${this.encodeRFC3986(this.flattenParams(params))}`
    // Key is credential secret, plus token secret (or empty string if not token), sep by &
    const key = [this.encodeRFC3986(this.creds.secret), this.encodeRFC3986(this.token?.oauth_token_secret || "")].join("&")
    // Signature is HMAC-SHA1 of the base url with key encoded in base64
    const HMAC = crypto.createHmac('sha1', key).update(baseUrl).digest('base64');
    return HMAC
  }

  /**
   * Escape URI components and replace some additioinal ones that Flickr doesn't like
   * @param str 
   * @returns 
   */
  private encodeRFC3986(str: string) {
    return encodeURIComponent(str).replace(regex, function (c) {
      return chars[c];
    });
  }

  /**
   * 
   * @returns Random nonce
   */
  private createNonce() {
    const nonce = crypto.pseudoRandomBytes(12).toString('base64');
    return nonce
  }

  /**
   * Parses text return
   * @param text Query string
   * @returns 
   */
  private parseText(text: string): Dictionary {
    const elements = text.split("&")
    if (elements.length === 1) {
      return { text }
    }
    const res: Dictionary = {}
    elements.forEach(elt => {
      const idx = elt.indexOf("=")
      const key = elt.substring(0, idx)
      const value = elt.substring(idx + 1)
      res[key] = value
    })
    return res
  }

  /**
   * Get a resource
   * @param method 
   * @param params 
   * @returns 
   */
  public get<T>(method: string, params: Dictionary): Promise<T> {
    return new Promise((resolve, reject) => {
      const parameters: Dictionary = {
        "nojsoncallback": "1",
        "format": "json",
        "method": method,
        "oauth_consumer_key": this.creds.key,
        "oauth_nonce": this.createNonce(),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": Date.now().toString(),
        "oauth_token": this.token?.oauth_token || "",
        "oauth_version": "1.0",
      }
      for (let key in params) {
        const value = params[key]
        parameters[key] = value
      }
      let url = `https://api.flickr.com/services/rest`
      const signature = this.calcSignature("GET", url, parameters)
      parameters["oauth_signature"] = signature
      const p = this.flattenParams(parameters)
      url = `${url}?${p}`

      superagent.get(url)
        .end((err, res) => {
          const contentType = res.header["content-type"]
          const content = contentType === "application/json" ? JSON.parse(res.text) : this.parseText(res.text)
          if (err) {
            reject(content)
          } else if (content["stat"] !== "ok") {
            reject(content)
          } else {
            resolve(content)
          }
        })
    })

  }
}


export interface FlickrStreams {
  streams: {
    stream: FlickrStream[]
  }
}

export interface FlickrStream {
  type: string,
  _content: string
}