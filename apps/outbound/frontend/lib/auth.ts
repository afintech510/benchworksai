import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const DEV_USER = process.env.DEV_USER_EMAIL || "admin@benchworksai.com";
const WEAK_DEFAULT_PASS = "benchworks-dev";
const DEV_PASS = process.env.DEV_USER_PASSWORD || WEAK_DEFAULT_PASS;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Fail closed at runtime: never allow login via the weak built-in default
        // in production. (Checked here, not at module load, so `next build` — which
        // runs with NODE_ENV=production but no runtime secrets — does not break.)
        if (
          process.env.NODE_ENV === "production" &&
          (!process.env.DEV_USER_PASSWORD ||
            process.env.DEV_USER_PASSWORD === WEAK_DEFAULT_PASS)
        ) {
          throw new Error(
            "DEV_USER_PASSWORD must be set to a strong, non-default value in production"
          );
        }
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
