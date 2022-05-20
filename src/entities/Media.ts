export enum MediaType {
  Undetermined,
  Photo,
  Video
}

export interface Media<T> {
  id: string,
  title: string,
  uploadDate: number,
  takenDate: number,
  type: "photo" | "video",
  record: T,
  url: string,
  originalName: string,
  downloaded: boolean,
  location: string
}