import { MediaSet } from "../entities/MediaSet"
import { ApiResponse } from "../webserver/ApiResponse"
import { MediasetHeader } from "../webserver/dtos/MediasetHeader"

export class ApiClient {
  private sendQueryAsync<T>(url: string, method: string = "GET", body: any = undefined, headers: { [key: string]: string } = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.onreadystatechange = function () {
        if (this.readyState === 4) {
          try {
            const response = JSON.parse(this.responseText) as ApiResponse<T>
            if (response.result === "success") {
              resolve(response.data as T)
            } else {
              reject(Error(response.error))
            }
          } catch (err) {
            console.log(err);
            reject(Error(this.responseText))
          }
        }
      }
      request.open(method, `/api/${url}`, true)
      Object.keys(headers).forEach(header => {
        request.setRequestHeader(header, headers[header])
      })
      if (body) {
        request.setRequestHeader("content-type", "application/json")
      }
      request.send(body ? JSON.stringify(body) : undefined)
    })
  }

  async getSetsAsync(): Promise<MediasetHeader[]> {
    const sets = await this.sendQueryAsync<MediasetHeader[]>("mediasets");
    return sets;
  }

  async getSetAsync(setId: string): Promise<MediaSet<any>> {
    const set = await this.sendQueryAsync<MediaSet<any>>(`mediasets/${setId}`);
    return set;
  }
}