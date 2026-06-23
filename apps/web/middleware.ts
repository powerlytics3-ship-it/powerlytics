import { withAuth } from "next-auth/middleware";

export default withAuth(
  (req) => {
    // This function only executes if authorized
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public paths
        if (
          pathname === "/login" ||
          pathname === "/auth" ||
          pathname === "/forbidden" ||
          pathname.startsWith("/_next")
        ) {
          return true;
        }

        // Protected paths require token
        return !!token;
      }
    },
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|api/auth).*)"]
};
