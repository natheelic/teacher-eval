import type { Metadata } from "next";
import { Inter, Manrope, Source_Code_Pro } from "next/font/google";
import { SearchProvider } from "@/components/search/SearchProvider";
import { CommandPalette } from "@/components/search/CommandPalette";
import { MobileNavProvider } from "@/components/layout/MobileNavProvider";
import "./globals.css";

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var mode = localStorage.getItem("theme") || "system";
    var effective = mode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.documentElement.setAttribute("data-theme", effective);
  } catch (e) {}
})();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "{{APP_NAME}}",
  description: "Project dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${sourceCodePro.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#fdfdfd] font-sans">
        <MobileNavProvider>
          <SearchProvider>
            {children}
            <CommandPalette />
          </SearchProvider>
        </MobileNavProvider>
      </body>
    </html>
  );
}
