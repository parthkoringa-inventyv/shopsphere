import type { ErrorRequestHandler } from 'express';

import { AppError } from '../errors/app-error.js';

function isMalformedJsonError(
  error: unknown,
): error is SyntaxError & { status: 400; type: 'entity.parse.failed' } {
  return (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400 &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  );
}
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // handle errors intentionally created by our application
  if (error instanceof AppError) {
    req.log.error({ err: error }, 'Application error');
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: String(req.id),
      },
    });
  }

  // handle malformed JSON request bodies
  if (isMalformedJsonError(error)) {
    req.log.error(
      { errorType: error.name, errorMessage: error.message },
      'Malformed JSON request body',
    );
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'The request body contains invalid JSON.',
        details: null,
        requestId: String(req.id),
      },
    });
  }

  // handle unexpected errors
  req.log.error({ err: error }, 'Unexpected error occurred');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      details: null,
      requestId: String(req.id),
    },
  });
};
