type HttpRequest = import("http").IncomingMessage;
type HttpResponse = import("http").ServerResponse;

type ApiStatus = {
  service: string;
  status: "ok" | "error";
};

type ApiError = {
  error: string;
};

type ApiResult<T> = {
  success: boolean;
  data: T | null;
  error: string;
};
