type Nullable<T> = T | null;

type AppActionResult<T> = {
  success: boolean;
  error: string;
  data: Nullable<T>;
};
