import { AppLayout } from "@/components/layout/app-layout";
import { MessageCircle, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (search.length > 0) {
      setIsLoading(true);
      fetch(`/api/users?search=${encodeURIComponent(search)}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          setUsers(data || []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    } else {
      setUsers([]);
    }
  }, [search]);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full bg-background">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-sidebar border-b border-sidebar-border flex items-center justify-between">
          <h1 className="font-display font-bold text-xl text-white">KlifGram</h1>
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Global Search Area */}
        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full flex-1">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for users to start a chat..."
              className="pl-12 h-14 bg-card border-card-border focus:border-primary rounded-2xl text-lg shadow-sm"
            />
          </div>

          {search.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">Global Search Results</h2>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-card/50 rounded-2xl">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : users?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No users found matching "{search}"</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {users?.map(user => (
                    <Link 
                      key={user.id} 
                      href={`/chat/${user.id}`}
                      className="flex items-center gap-4 p-4 bg-card hover:bg-card/80 border border-card-border rounded-2xl transition-all cursor-pointer group"
                    >
                      <Avatar className="w-14 h-14 border border-white/5 shadow-sm group-hover:scale-105 transition-transform">
                        <AvatarImage src={user.avatarUrl || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary">{user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-white">{user.displayName || user.username}</h3>
                          {user.nftUsername && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                              @{user.nftUsername}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">@{user.username}</p>
                      </div>
                      <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center pb-20 opacity-50">
              <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-6 shadow-inner">
                <MessageCircle className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-display font-semibold text-white mb-2">Welcome to KlifGram</h2>
              <p className="text-muted-foreground max-w-sm">
                Select a chat from the sidebar or search for a username to start messaging securely.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}