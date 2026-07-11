import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "CASAtlas",
  description: "Document and manage your IB CAS journey",
  // Set the base URL for resolving relative URLs in metadata (e.g., openGraph images)
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : new URL("http://localhost:3000"),
  icons: [
    {
      url: "/favicon.svg",
      type: "image/svg+xml",
    },
  ],
  openGraph: {
    images: [
      {
        url: "/social-preview.svg",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
