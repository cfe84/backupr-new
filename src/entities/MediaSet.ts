export interface MediaSet<T> {
  id: string,
  name: string,
  primaryPhotoId: string,
  description: string,
  mediaIds: string[]
  record: T
}