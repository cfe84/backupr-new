export interface ApiResponse<T> {
  result: "success" | "error"
  data?: T | undefined
  error?: string
}