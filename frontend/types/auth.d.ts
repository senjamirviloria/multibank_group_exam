type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type LoginActionState = {
  success: boolean;
  error: string;
  user: Nullable<AuthUser>;
};

type CurrentUserActionResult = {
  user: Nullable<AuthUser>;
  error: string;
};

type AuthState = {
  user: Nullable<AuthUser>;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};
