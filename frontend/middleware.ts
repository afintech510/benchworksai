import { withAuth } from "next-auth/middleware";

// Enforce a valid next-auth session on every dashboard route. Redirects
// anonymous users to /login. Deliberately scoped to the Next.js app only:
// the FastAPI /v1/* surface (webhooks, n8n cron, larkin handoff) is served by
// Caddy, NOT this app, so it is unaffected.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    // Everything except the login page, the next-auth endpoints, and static assets.
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
