const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.statusCode || err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message;
  if (['ValidationError', 'CastError', 'SyntaxError', 'MulterError'].includes(err.name)) status = 400;
  if (err.code === 11000) { status = 409; message = 'This record already exists'; }
  if (err.name === 'VersionError') { status = 409; message = 'Record changed; refresh and retry'; }
  if (status >= 500) {
    console.error(JSON.stringify({ event: 'request_error', requestId: req.id, code: err.code, message: err.message }));
    message = 'Service temporarily unavailable. Please retry.';
  }
  res.status(status).json({ success: false, message, requestId: req.id });
};
module.exports = { errorHandler };
