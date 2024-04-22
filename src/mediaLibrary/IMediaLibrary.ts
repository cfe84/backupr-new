import { Media } from "../entities/Media";
import { MediaSet } from "../entities/MediaSet";

export interface IMediaLibrary<TMedia, TMediaSet> {
  updateMediaAsync(media: Media<TMedia>): Promise<void>;
  addMedia(media: Media<TMedia>): Promise<void>;
  addMedias(medias: Media<TMedia>[]): Promise<void>;
  getMediaAsync(id: string): Promise<Media<TMedia> | undefined>;
  getMediaWithNoHashAsync(): Promise<Media<TMedia>[]>;
  getNonDownloadedMedia(): Promise<Media<TMedia>[]>;
  getNonUploadedMedia(): Promise<Media<TMedia>[]>;
  getMaxUploadDate(): Promise<number | undefined>

  addMediaSetsAsync(mediaSets: MediaSet<TMediaSet>[]): Promise<void>;
  updateMediaSetAsync(mediaSet: MediaSet<TMediaSet>): Promise<void>;
  getMediaSets(): Promise<MediaSet<TMediaSet>[]>;
  getOutdatedMediasetsAsync(): Promise<MediaSet<TMediaSet>[]>;
  getNonUploadedMediaSetsAsync(): Promise<MediaSet<TMediaSet>[]>;
}