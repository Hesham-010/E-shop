//@descthis   class is responsible about operation errors
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? "faild" : "error";
  }
}

module.exports = ApiError;
