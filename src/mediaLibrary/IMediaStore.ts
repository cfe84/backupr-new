import { Media } from "../entities/Media";

export interface IMediaStore<T> {
  /**
   * Store media
   * @param media
   * return path to media 
   */
  downloadMedia(media: Media<T>): Promise<string>

  /**
   * Get content of the media as a buffer
   * @param media 
   */
  getMediaContent(media: Media<T>): Promise<Buffer>
}