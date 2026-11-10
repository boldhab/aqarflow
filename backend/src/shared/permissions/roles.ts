export const ROLES = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 2,
  AGENT: 1,
};
