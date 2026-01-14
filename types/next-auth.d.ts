import { DefaultSession } from "next-auth";

declare module "next-auth" {
  export interface Session {
    user: { role: string; emailVerified: Date | null } & DefaultSession["user"];
  }
}
