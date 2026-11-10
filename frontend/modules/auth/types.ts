export type UserRole = 'ADMIN' | 'AGENT';

export interface Agency {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agency: Agency;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthApiResponse {
  success: boolean;
  data: {
    user: User;
  };
}
