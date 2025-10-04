"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider } from "antd";
import "./globals.css";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const persister = persistStore(store);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persister}>
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
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
