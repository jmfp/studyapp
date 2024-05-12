import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import Navigation from "./components/navigation/navbar/Navbar"
import {ThemeProvider} from './components/theme-provider'
import { Providers } from "../app/blog/[slug]/providers";
import { ClerkProvider } from '@clerk/nextjs'


const inter = Inter({ subsets: ["latin"] });
const nunito = Nunito({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "JesseTheDev",
  description: "Software Development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
          <ClerkProvider>
          <Navigation/>
          {children}
          </ClerkProvider>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
          <script>hljs.highlightAll();</script>
          <script>hljs.highlightOnLoad();</script>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
