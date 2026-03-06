type HttpRequest = import("http").IncomingMessage;
type HttpResponse = import("http").ServerResponse;
type JwtBasePayload = import("jsonwebtoken").JwtPayload;

type ApiError = {
  error: string;
};

type ApiResult<T> = {
  success: boolean;
  data: T | null;
  error: string;
};
