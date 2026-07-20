import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CampusFind AI", template: "%s | CampusFind AI" },
  description: "AI-assisted lost-and-found matching for university campuses."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body></html>;
}
