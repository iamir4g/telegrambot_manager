export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};
