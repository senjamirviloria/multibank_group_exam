export const port = Number(process.env.PORT) || 4001;
export const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
export const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:3110";

export const mockUsername = process.env.MOCK_AUTH_USERNAME || "demo@multibank.local";
export const mockPassword = process.env.MOCK_AUTH_PASSWORD || "password123";

export const mockUser: MockUser = {
  id: "user-1",
  email: "demo@multibank.local",
  name: "Demo User",
};
