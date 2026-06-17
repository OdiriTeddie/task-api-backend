type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const writeLog = (level: LogLevel, message: string, meta?: LogMeta) => {
  const logEntry = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  const serializedLog = JSON.stringify(logEntry);

  if (level === "error") {
    console.error(serializedLog);
    return;
  }

  if (level === "warn") {
    console.warn(serializedLog);
    return;
  }

  console.log(serializedLog);
};

export const logger = {
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
  error: (message: string, meta?: LogMeta) => writeLog("error", message, meta),
};
