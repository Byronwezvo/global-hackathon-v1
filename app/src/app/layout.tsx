import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#000", // primary color black
              borderRadius: 0, // remove border radius globally
              controlOutlineWidth: 0, // remove outlines for inputs/buttons
            },
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
