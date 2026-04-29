import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Tracker API",
  description: "API backend for employee GPS tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
