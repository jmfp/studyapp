import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import Navigation from "./components/navigation/navbar/Navbar"
import {ThemeProvider} from './components/theme-provider'
import { Providers } from "../app/blog/[slug]/providers";


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
      <meta name="google-adsense-account" content="ca-pub-9522353240660967"></meta>
      <body className={nunito.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
          <Navigation/>
          {children}
          <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" async></script>
          <script async>hljs.highlightAll();</script>
          <script async>hljs.highlightOnLoad();</script>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
