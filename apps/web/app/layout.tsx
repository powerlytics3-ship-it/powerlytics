import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Powerlytic",
  description: "Industrial IoT monitoring and actuation platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
