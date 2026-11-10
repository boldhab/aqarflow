export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    agencyId: string;
  };
  tokens: {
    accessToken: string;
  };
}
