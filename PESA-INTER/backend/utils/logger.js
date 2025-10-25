/**
 * Simple Logger Utility - PESA-INTER Package
 * Provides basic logging functionality with different levels
 * Can be replaced with more sophisticated logging libraries like Winston
 * 
 * @author PESA-INTER Package
 * @version 1.0.0
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4
};

class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || process.env.LOG_LEVEL || 'info',
      enableColors: config.enableColors !== false,
      enableTimestamp: config.enableTimestamp !== false,
      ...config
    };
    
    this.currentLevel = LOG_LEVELS[this.config.level.toUpperCase()] || LOG_LEVELS.INFO;
  }

  /**
   * Get timestamp string
   */
  getTimestamp() {
    if (!this.config.enableTimestamp) return '';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${ms}`;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const timestampStr = timestamp ? `${timestamp} ` : '';
    
    let formattedMessage = `${timestampStr}${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      formattedMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return formattedMessage;
  }

  /**
   * Log with color support
   */
  logWithColor(level, color, message, meta) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, meta);
    
    if (this.config.enableColors && typeof window === 'undefined') {
      // Node.js environment with color support
      const colors = {
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        reset: '\x1b[0m'
      };
      
      console.log(`${colors[color] || ''}${formattedMessage}${colors.reset}`);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Check if we should log at this level
   */
  shouldLog(level) {
    const levelValue = LOG_LEVELS[level.toUpperCase()];
    return levelValue <= this.currentLevel;
  }

  /**
   * Error logging
   */
  error(message, meta = {}) {
    this.logWithColor('error', 'red', message, meta);
  }

  /**
   * Warning logging
   */
  warn(message, meta = {}) {
    this.logWithColor('warn', 'yellow', message, meta);
  }

  /**
   * Info logging
   */
  info(message, meta = {}) {
    this.logWithColor('info', 'green', message, meta);
  }

  /**
   * HTTP logging
   */
  http(message, meta = {}) {
    this.logWithColor('http', 'magenta', message, meta);
  }

  /**
   * Debug logging
   */
  debug(message, meta = {}) {
    this.logWithColor('debug', 'cyan', message, meta);
  }
}

// Create default logger instance
const defaultLogger = new Logger();

// Export both the class and default instance
module.exports = defaultLogger;
module.exports.Logger = Logger;
module.exports.LOG_LEVELS = LOG_LEVELS;
