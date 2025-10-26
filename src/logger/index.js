const formatMessage = (level, messages) => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level.toUpperCase()}]`, ...messages];
};

const log = (level, ...messages) => {
  const formatted = formatMessage(level, messages);
  if (level === 'error') {
    console.error(...formatted);
  } else if (level === 'warn') {
    console.warn(...formatted);
  } else {
    console.log(...formatted);
  }
};

export const logger = {
  info: (...messages) => log('info', ...messages),
  warn: (...messages) => log('warn', ...messages),
  error: (...messages) => log('error', ...messages),
  debug: (...messages) => {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', ...messages);
    }
  }
};
