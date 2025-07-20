// types/next-auth.d.ts

import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
    accessToken: string
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    accessToken?: string
    name?: string | null;
    image?: string | null;
  }
}
