export { default } from "next-auth/middleware";

export const config = {
  // Lindungi halaman utama dan semua route di bawahnya (kecuali /login, /api, dan aset statis)
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
