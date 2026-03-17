// Basic request validation and normalization for query parameters
module.exports = (req, res, next) => {
  try {
    const q = req.query || {};

    // Validate pagination
    if (q.page !== undefined) {
      const page = parseInt(q.page, 10);
      if (Number.isNaN(page) || page < 1) {
        const err = new Error("Invalid 'page' parameter. Must be a positive integer.");
        err.statusCode = 400;
        throw err;
      }
      req.query.page = page;
    }
    if (q.limit !== undefined) {
      const limit = parseInt(q.limit, 10);
      if (Number.isNaN(limit) || limit < 1 || limit > 1000) {
        const err = new Error("Invalid 'limit' parameter. Must be an integer between 1 and 1000.");
        err.statusCode = 400;
        throw err;
      }
      req.query.limit = limit;
    }

    // Validate sort (comma-separated fields, allow leading - for desc)
    if (q.sort !== undefined) {
      const sortOk = String(q.sort)
        .split(',')
        .every((field) => /^[\-]?[A-Za-z0-9_\.]+$/.test(field));
      if (!sortOk) {
        const err = new Error("Invalid 'sort' parameter format.");
        err.statusCode = 400;
        throw err;
      }
    }

    // Validate fields selection (comma-separated)
    if (q.fields !== undefined) {
      const fieldsOk = String(q.fields)
        .split(',')
        .every((field) => /^[A-Za-z0-9_\.]+$/.test(field));
      if (!fieldsOk) {
        const err = new Error("Invalid 'fields' parameter format.");
        err.statusCode = 400;
        throw err;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

