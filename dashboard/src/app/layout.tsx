import type { Metadata } from "next";
import "@/app/globals.css";

import { APP_NAME, APP_DESCRIPTION } from "../../config/app";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: APP_NAME + " | %s" },
  description: APP_DESCRIPTION,
};

export default function PDFReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}