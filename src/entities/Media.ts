export enum MediaType {
  Undetermined,
  Photo,
  Video
}

export interface Media<T> {
  id: string,
  title: string,
  uploadDate: number,
  url: string,
  type: MediaType,
  record: T,
  downloaded: boolean,
  location: string
}