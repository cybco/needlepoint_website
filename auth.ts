import NextAuth from "next-auth";
import { prisma } from "@/db/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { compareSync } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";

export const config = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days renewal
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (credentials == null) return null;

        //find user in database
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
        });

        //check if user exists and if password matches
        if (user && user.password) {
          const isMatch = compareSync(credentials.password as string, user.password);
          //If password is correct, check if suspended then return user
          if (isMatch) {
            // Check if user is suspended
            if (!user.isActive) {
              throw new Error("Your account has been suspended. Please contact support.");
            }
            return {
              id: user.id,
              name: user.firstName,
              email: user.email,
              role: user.role,
            };
          }
        }
        //if user does not exist or password does not match then return null
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user, trigger }: any) {
      //set user ID from token
      session.user.id = token.sub;
      session.user.role = token.role;
      session.user.name = token.name;

      // if there is an update, set the user name
      if (trigger === "update") {
        session.user.name = user.firstName;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }: any) {
      // Assign user fields to tokens
      if (user) {
        token.role = user.role;
        token.id = user.id;
        // if user has no firstName then use email
        if (user.name == "NO_NAME") {
          token.name = user.email!.split("@")[0];
        }
      }
      return token;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
