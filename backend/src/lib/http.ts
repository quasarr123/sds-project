/** Thrown inside a transaction to abort it and send a specific HTTP status + message. */
export class HttpError extends Error {
  code: number;
  /** Extra fields merged into the JSON error body (e.g. the conflicting time ranges). */
  data?: Record<string, unknown>;
  constructor(code: number, message: string, data?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

/** Turns an HttpError into the response body `{ message, ...data }` with the right status. */
export function httpFail(ctx: any, e: HttpError) {
  ctx.set.status = e.code;
  return { message: e.message, ...e.data };
}
