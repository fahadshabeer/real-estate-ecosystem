import type { AccountRole, AuthSession } from "@/lib/backend/types/entities";

export type SignUpInput = {
  email: string;
  password: string;
  role: Extract<AccountRole, "developer_admin" | "broker_admin">;
  companyId: string;
};

export type SignInInput = {
  identifier: string;
  password: string;
};

export type AuthRepository = {
  signUp(input: SignUpInput): Promise<AuthSession>;
  signIn(input: SignInInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;
};
