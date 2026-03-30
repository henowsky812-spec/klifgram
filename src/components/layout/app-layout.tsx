import { ReactNode, useEffect, useState } from "react";
import { Sidebar, MobileNav } from "./sidebar";
import { useLocation } from "wouter";
import { socket } from "@/lib/socket";
import { Inventory } from "@/components/inventory";

export function AppLayout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setIsError(true);
        }
      } catch (err) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    if (isError) {
      setLocation("/login");
    }
  }, [isError, setLocation]);

  useEffect(() => {
    if (user) {
      socket.connect();
      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden pb-[72px] md:pb-0">
        <div className="absolute top-4 right-4 z-50 hidden md:block">
          <Inventory />
        </div>
        {children}
      </main>
      <MobileNav />
      <div className="md:hidden fixed bottom-20 right-4 z-50">
        <Inventory />
      </div>
    </div>
  );
}