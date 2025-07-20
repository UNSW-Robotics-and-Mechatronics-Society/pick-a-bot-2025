import { pgRole } from "drizzle-orm/pg-core";

export const anonRole = pgRole("anon").existing();
export const authenticatedRole = pgRole("authenticated").existing();
export const serviceRole = pgRole("service_role").existing();
export const postgresRole = pgRole("postgres_role").existing();
export const supabaseAuthAdminRole = pgRole("supabase_auth_admin").existing();
