export interface MediaSet<T> {
  id: string,
  lastUpdate: number,
  contentAsOf: number,
  name: string,
  primaryPhotoId: string,
  description: string,
  mediaIds: string[]
  record: T
}