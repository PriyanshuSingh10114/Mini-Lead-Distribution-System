import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mini Lead Distribution System",
  description: "A system to distribute leads fairly among providers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <nav className="bg-white shadow-sm mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="font-bold text-xl text-blue-600">LeadSystem</div>
              <div className="flex space-x-4">
                <Link href="/request-service" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Request Service</Link>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                <Link href="/test-tools" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Test Tools</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
