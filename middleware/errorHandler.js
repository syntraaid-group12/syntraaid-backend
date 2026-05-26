// Global error handler — must be registered last in server.js
// Catches any error passed via next(err) from any route or controller
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`)

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
