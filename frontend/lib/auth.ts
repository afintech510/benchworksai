import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEV_USER = process.env.DEV_USER_EMAIL || "admin@benchworksai.com";
const DEV_PASS = process.env.DEV_USER_PASSWORD || "benchworks-dev";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === DEV_USER &&
          credentials?.password === DEV_PASS
        ) {
          return {
            id: "dev-operator",
            email: DEV_USER,
            name: "Dev Operator",
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async jwt({ token }) {
      token.role = "operator";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
