import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/dashboard/auth-provider";
import { AppLayout } from "@/components/dashboard/app-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/lib/query-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Elite Mentorship | Prokodex Dashboard",
  description: "Video Portal and Mentorship Dashboard",
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/logo-light.png',
        href: '/logo-light.png',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/logo-dark.png',
        href: '/logo-dark.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans bg-zinc-950 text-zinc-100 flex h-[100dvh] overflow-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <AuthProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </AuthProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
