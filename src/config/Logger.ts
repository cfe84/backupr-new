interface Log {
  level: string,
  message: any[]
}

function logToString(log: Log): string {
  return `${log.level} ${log.message.join(" ")}`;
}

export class Logger {
  constructor(private logLevel: "debug" | "log" | "warn" | "error") { }

  private logs: Log[] = [];

  private addLog(level: string, message: any, params: any[]) {
    this.logs.push({
      level,
      message: [message, ...params]
    })
  }

  debug(message?: any, ...params: any[]) {
    if (this.logLevel !== "debug") {
      return
    }
    this.addLog("DEBUG", message, params)
    console.log(message, ...params)
  }
  log(message?: any, ...params: any[]) {
    if (this.logLevel !== "debug" && this.logLevel !== "log") {
      return
    }
    this.addLog("INFO ", message, params)
    console.log(message, ...params)
  }
  warn(message?: any, ...params: any[]) {
    if (this.logLevel === "error") {
      return
    }
    this.addLog("WARN ", message, params)
    console.warn(message, ...params)
  }
  error(message?: any, ...params: any[]) {
    this.addLog("ERROR", message, params)
    console.error(message, ...params)
  }
  getLogs(): string[] {
    return this.logs.map(logToString);
  }
}