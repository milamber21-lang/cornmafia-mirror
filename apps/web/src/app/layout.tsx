// FILE: apps/web/src/app/layout.tsx
import "./globals.css";
import Header from "../components/Header";
import Menu from "../components/Menu";
import Footer from "../components/Footer";
import ScrollReset from '@/components/ScrollReset';

export const metadata = {
  title: "Corn Mafia",
  description: "Cornucopias guild",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="cm-dark">
      <head>
        <link rel="icon" href="/logos/favicon-32x32.png" sizes="32x32" />
        <meta name="theme-color" content="#0B0B0C" />
      </head>
      <body>
        <ScrollReset />
        <header className="header">
          <div className="container header-inner">
            <Header />
          </div>
        </header>
        <Menu />
        <main className="main">
          <div className="container">{children}</div>
        </main>

        <footer className="footer">
          <div className="container">
            <Footer />
          </div>
        </footer>
      </body>
    </html>
  );
}
