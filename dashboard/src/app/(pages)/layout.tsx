// import type { Metadata } from "next";
// import "./globals.css";

import Navbar from "../components/Navbar";
import PageNavbar from "../components/PageNavbar";

// import { APP_NAME, APP_DESCRIPTION } from "../../../config/app";

// export const metadata: Metadata = {
//   title: APP_NAME,
//   description: APP_DESCRIPTION,
// };

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col justify-between min-h-screen">
      <div>
        {/* App bar. */}
        <Navbar />
        {/* Content Slate. */}
        <div className="container mx-auto p-4">
          {/* Page navigation. */}
          <PageNavbar />
          <main className="flex-1 flex-col w-full space-y-2 min-h-[calc(0.8*100vh)] py-4 border-t border-gray-300">
            {children}
          </main>
        </div>
      </div>
      {/* Footer. */}
      <footer className="p-2">
        {/* <p>LAS Team 20.</p> */}
      </footer>
    </div>
  );
}
