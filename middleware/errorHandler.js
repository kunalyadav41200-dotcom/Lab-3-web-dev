function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(error => error.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'SKU already exists. Please use a unique SKU.';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid product ID or field value';
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
