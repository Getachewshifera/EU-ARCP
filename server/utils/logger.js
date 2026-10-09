// Purpose: Shared server logging setup.
function formatTimestamp(date = new Date()) {
  return date.toISOString();
}

function createLogger(namespace = 'app') {
  const prefix = `[${namespace}]`;

  return {
    info(message, ...details) {
      console.info(prefix, formatTimestamp(), 'INFO', message, ...details);
    },
    warn(message, ...details) {
      console.warn(prefix, formatTimestamp(), 'WARN', message, ...details);
    },
    error(message, ...details) {
      console.error(prefix, formatTimestamp(), 'ERROR', message, ...details);
    },
    debug(message, ...details) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(prefix, formatTimestamp(), 'DEBUG', message, ...details);
      }
    },
  };
}

module.exports = { createLogger, formatTimestamp };
