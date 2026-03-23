class ApiError extends Error {
  status: number;
  data?: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.status = statusCode;
    this.data = data;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
