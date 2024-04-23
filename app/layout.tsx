import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import Navigation from "./components/navigation/navbar/"
import {ThemeProvider} from './components/theme-provider'

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
          <Navigation/>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
