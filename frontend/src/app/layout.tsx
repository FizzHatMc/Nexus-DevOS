import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarLeft } from "@/components/layout/SidebarLeft";
import { SidebarRight } from "@/components/layout/SidebarRight";
import { ProjectProvider } from "@/lib/ProjectContext";
import { CommandPalette } from "@/components/layout/CommandPalette";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus-DevOS",
  description: "Knowledge Engine and Project Cockpit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex h-screen overflow-hidden bg-background text-foreground`}>
        <ProjectProvider>
          {/* Left Sidebar */}
          <SidebarLeft />
          
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 border-x border-border/50 bg-muted/10">
            {children}
          </main>
          
          {/* Right Context Sidebar */}
          <SidebarRight />

          {/* Global Command Palette */}
          <CommandPalette />
        </ProjectProvider>
      </body>
    </html>
  );
}


