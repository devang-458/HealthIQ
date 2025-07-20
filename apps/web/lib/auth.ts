import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        // Check user from DB (not via fetch)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or user not found");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = jwt.sign(
          { id: user.id, email: user.email },
          NEXTAUTH_SECRET,
          { expiresIn: "1h" }
        );
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session as any).accessToken = token.accessToken;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
