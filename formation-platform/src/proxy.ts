import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/console")) {
    if (role !== "ADMIN") {
      const url = new URL("/connexion", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!role || (role !== "ADMIN" && role !== "CREATOR")) {
      const url = new URL("/connexion", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/mon-apprentissage")) {
    if (!req.auth) {
      const url = new URL("/connexion", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: ["/console/:path*", "/admin/:path*", "/mon-apprentissage/:path*"],
};
