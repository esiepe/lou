const winston = require('winston');
const path = require('path');

// Create custom logger
exports.createLogger = (module) => {
  const filename = module.filename || 'app';
  const moduleName = path.basename(filename, '.js');
  
  // Define log format
  const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}] [${moduleName}]: ${message}`;
  });
  
  // Return configured logger
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      logFormat
    ),
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      // File transport for errors
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      // File transport for all logs
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      })
    ],
    // Do not exit on handled exceptions
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: 'logs/exceptions.log' 
      })
    ]
  });
}; 