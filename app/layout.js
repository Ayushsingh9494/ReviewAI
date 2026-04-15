import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

export const metadata = {
  title: "AI Review Aggregator",
  description: "Find the best products with realistic AI reviews.",
};

import { Sidebar } from "./components/Sidebar";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-layout">
            <Sidebar />
            <div className="app-content">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
