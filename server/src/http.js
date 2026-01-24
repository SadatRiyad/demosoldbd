function json(res, status, body) {
  res.status(status).type("application/json").send(JSON.stringify(body));
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  json,
  asyncHandler,
};
