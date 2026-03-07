type JwtBasePayload = import("jsonwebtoken").JwtPayload;

type AuthTokenPayload = JwtBasePayload & {
  sub: string;
  email: string;
  name: string;
};
