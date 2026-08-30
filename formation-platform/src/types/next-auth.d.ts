import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "CREATOR" | "LEARNER";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "CREATOR" | "LEARNER";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "CREATOR" | "LEARNER";
  }
}
