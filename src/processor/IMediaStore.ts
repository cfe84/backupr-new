import { Media } from "../entities/Media";

export interface IMediaStore<T> {
  /**
   * Store media
   * @param media
   * return path to media 
   */
  downloadMedia(media: Media<T>): Promise<string>
}