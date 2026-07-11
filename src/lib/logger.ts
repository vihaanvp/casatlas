type LogLevel = "error" | "warn" | "info" | "debug"

interface LogContext {
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  }

  if (level === "error") {
    console.error(JSON.stringify(entry))
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  error: (message: string, context?: LogContext) => log("error", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "development") {
      log("debug", message, context)
    }
  },
}
