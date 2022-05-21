export class Logger {
  constructor(private logLevel: "debug" | "log" | "warn" | "error") { }
  debug(message?: any, ...params: any[]) {
    if (this.logLevel !== "debug") {
      return
    }
    console.log(message, ...params)
  }
  log(message?: any, ...params: any[]) {
    if (this.logLevel !== "debug" && this.logLevel !== "log") {
      return
    }
    console.log(message, ...params)
  }
  warn(message?: any, ...params: any[]) {
    if (this.logLevel === "error") {
      return
    }
    console.warn(message, ...params)
  }
  error(message?: any, ...params: any[]) {
    console.error(message, ...params)
  }
}