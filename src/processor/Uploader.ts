import { Logger } from "../config/Logger";
import { Media, MediaProcessError } from "../entities/Media";
import { IMediaLibrary } from "../mediaLibrary/IMediaLibrary";
import { IStorageService } from "../services/IStorageService";

const errors = {
  ASSET_UPLOAD_ERROR: "ASSET_UPLOAD_ERROR",
  ASSET_UPLOAD_DUPLICATE: "ASSET_UPLOAD_DUPLICATE",
};

export class Uploader {
  constructor(
    private target: IStorageService,
    private library: IMediaLibrary<any, any>,
    private logger: Logger) {
  }

  async processAsync() {
    await this.target.loginAsync();
    await this.uploadPhotos();
    await this.uploadAlbums();
  }

  async uploadPhotos() {
    this.logger.log(`### Upload missing media ###`)
    let i = 1;
    const missingMedia = await this.library.getNonUploadedMedia();
    for (let media of missingMedia) {
      const duplicateError = this.getErrorOfType(media, errors.ASSET_UPLOAD_DUPLICATE);
      if (duplicateError.count > 1) {
        this.logger.warn(`Ignoring asset ${media.id} (${media.title}) which has been detected as duplicate.`);
        continue;
      }
      const uploadError = this.getErrorOfType(media, errors.ASSET_UPLOAD_ERROR);
      if (uploadError.count > 3) {
        this.logger.warn(`Ignoring asset ${media.id} (${media.title}) as it already failed uploaded thrice.`);
        continue;
      }
      this.logger.log(`Uploading ${i++}/${missingMedia.length}: ${media.originalName} (${media.title} - ${media.id})`)
      try {
        const id = await this.target.uploadMediaAsync(media);
        media.externalId = id;
      } catch (ex: any) {
        // For duplicates we just log the error and carry on.
        if (ex.message.startsWith(`duplicate`)) {
          const id = ex.message.split(`:`)[1];
          this.logger.error(`Asset ${media.id} (${media.title}) detected as duplicate of ${id}`);
          duplicateError.count++;
          duplicateError.message = id;
          this.addError(media, duplicateError); // Only adds if it's not there
        } else {
          this.logger.error(`Failed uploading ${media.id} (${media.title}) with error ${ex.message}`);
          uploadError.count++;
          uploadError.message = ex.message;
          this.addError(media, uploadError); // Only adds if it's not there
        }
      }
      await this.library.updateMediaAsync(media);
    }
  }

  private getErrorOfType(media: Media<any>, errorCode: string): MediaProcessError {
    const newError = {
      code: errorCode,
      message: "",
      count: 0
    }
    if (!media.errors) {
      return newError
    }
    let error = media.errors.find(err => err.code === errorCode)
    if (!error) {
      return newError
    }
    return error
  }

  private async addError(media: Media<any>, error: MediaProcessError) {
    if (!media.errors) {
      media.errors = []
    }
    if (media.errors.indexOf(error) < 0) {
      media.errors.push(error)
    }
  }

  public async uploadAlbums() {
    this.logger.log(`### Upload missing albums ###`);

    let i = 1;
    const missingMediaSet = await this.library.getNonUploadedMediaSetsAsync();
    for (let mediaSet of missingMediaSet) {
      // Retrieve the external ids. To be extracted to its own private.
      let primaryMediaId: string = "";
      let mediaIds: string[] = [];
      try {
        const externalMediaIds = await Promise.all(mediaSet.mediaIds.map(mediaId => this.findExternalMediaId(mediaId)));
        if (externalMediaIds.indexOf(undefined) >= 0) {
          this.logger.warn(`Mediaset ${mediaSet.name} (${mediaSet.id}) has un-uploaded media. Skipping.`);
          continue;
        }
        mediaIds = [...new Set(externalMediaIds as string[])]; // Deduplicate
      } catch (err: any) {
        this.logger.error(`Mediaset ${mediaSet.name} (${mediaSet.id}): Error retrieving media: ${err.message}. Skipping this mediaset.`);
        continue;
      }

      // Get primary id.
      const externalMediaId = await this.findExternalMediaId(mediaSet.primaryPhotoId);
      if (!externalMediaId) {
        this.logger.warn(`Mediaset ${mediaSet.name} (${mediaSet.id}) has un-uploaded primary media. Skipping.`);
        continue;
      }
      primaryMediaId = externalMediaId as string;

      // Upload
      try {
        const id = await this.target.createMediaSet(mediaSet, primaryMediaId, mediaIds);
        mediaSet.externalId = id;
      } catch (err: any) {
        this.logger.error(`Error creating mediaset ${mediaSet.name} (${mediaSet.id}): ${err.message}`);
        continue;
      }
      await this.library.updateMediaSetAsync(mediaSet);
    }
  }

  private async findExternalMediaId(mediaId: string): Promise<string | undefined> {
    const media = await this.library.getMediaAsync(mediaId);
    if (!media) {
      throw Error(`Media ID ${mediaId} not found`);
    }
    const duplicateError = this.getErrorOfType(media, errors.ASSET_UPLOAD_DUPLICATE);
    if (duplicateError.count > 0) {
      return duplicateError.message;
    }
    if (media.externalId === undefined) {
      this.logger.warn(`Media ${mediaId} does not have an external id.`);
    }
    return media.externalId;
  }
}