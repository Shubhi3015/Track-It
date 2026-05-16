export function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(status).json({ message: status === 500 ? 'Something went wrong' : err.message });
}
