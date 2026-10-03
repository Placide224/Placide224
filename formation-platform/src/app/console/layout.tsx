import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Console admin | NT7East",
  description: "Console d'administration inspirée du design Shopify.",
};

export default function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#f5f5f3] text-zinc-900">
      <div className="mx-auto max-w-[1800px]">{children}</div>
    </div>
  );
}
