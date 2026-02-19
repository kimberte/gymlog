import "./globals.css";
import { Poppins } from "next/font/google";

export const metadata = {
  title: "Gym Log",
};
export const viewport = { themeColor: "#1f2937" };

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
