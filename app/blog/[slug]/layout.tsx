import { Providers } from "./providers";
import Navigation from "../../components/navigation/navbar/Navbar"


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}