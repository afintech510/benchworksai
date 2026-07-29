import Sidebar from "@/components/Sidebar";
import CommandBar from "@/components/CommandBar";
import { Providers } from "@/lib/providers";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">{children}</main>
        <CommandBar />
      </div>
    </Providers>
  );
}
