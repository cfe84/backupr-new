import { Media } from "../entities/Media";
import { MediaSet } from "../entities/MediaSet";

export interface IStorageService {
  loginAsync(): Promise<void>;
  uploadMediaAsync(media: Media<any>): Promise<string> // Uploads media and returns an external id
  createMediaSet(mediaSet: MediaSet<any>, primaryMediaExternalId: string, mediaExternalIds: string[]): Promise<string> // Creates a mediaset and returns an external id.
}