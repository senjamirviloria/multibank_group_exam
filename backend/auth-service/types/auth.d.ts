type MockUser = {
  id: string;
  email: string;
  name: string;
};

type LoginRequestBody = {
  email?: string;
  password?: string;
};

type AuthTokenPayload = JwtBasePayload & {
  sub: string;
  email: string;
  name: string;
};

type LoginResponse = {
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: number;
  user: MockUser;
};

type CurrentUserResponse = {
  user: MockUser;
};
