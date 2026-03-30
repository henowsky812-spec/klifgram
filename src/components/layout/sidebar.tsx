import { Link, useLocation } from "wouter";
import { MessageCircle, Star, Sparkles, Phone, Package, ShieldCheck, User, ShoppingBag, BadgeCheck, Store } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isChatsLoading, setIsChatsLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUserLoading(false);
      }
    };
    fetchMe();

    const fetchChats = async () => {
      try {
        const res = await fetch("/api/chats", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setChats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsChatsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const navItems = [
    { icon: MessageCircle, label: t("chats"), href: "/" },
    { icon: Star, label: t("stars"), href: "/stars" },
    { icon: Sparkles, label: t("nft"), href: "/nft" },
    { icon: Phone, label: t("numbers"), href: "/numbers" },
    { icon: Package, label: t("cases"), href: "/cases" },
    { icon: ShoppingBag, label: t("marketplace"), href: "/marketplace" },
    { icon: Store, label: t("shop"), href: "/shop" },
  ];

  if (user?.isAdmin || user?.username === "henowsky") {
    navItems.push({ icon: ShieldCheck, label: t("admin"), href: "/admin" });
  }

  return (
    <div className="w-80 h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 z-10 hidden md:flex">
      {/* Header Profile */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between bg-sidebar/50 backdrop-blur-sm">
        {isUserLoading ? (
          <div className="flex items-center space-x-3 w-full">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : user ? (
          <Link href="/profile/me" className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-1 min-w-0">
            <Avatar className="w-10 h-10 border border-white/10 shadow-sm flex-shrink-0">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/20 text-primary">{user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-display font-semibold text-sm truncate">{user.displayName || user.username}</h3>
                {(user.isAdmin || user.username === "henowsky") && (
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-amber-400 mr-1 fill-amber-400" />
                {user.stars?.toLocaleString() || 0}
              </div>
            </div>
          </Link>
        ) : null}
        {/* Language Switch */}
        <button
          onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          className="ml-2 flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all border border-white/5"
          title={t("language")}
        >
          {lang === "ru" ? "EN" : "RU"}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("chats")}
        </div>
        {isChatsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center p-2 space-x-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))
        ) : chats?.length === 0 ? (
          <div className="text-center p-4 text-sm text-muted-foreground">
            {t("noChats")}
          </div>
        ) : (
          chats?.map(chat => (
            <Link
              key={chat.userId}
              href={`/chat/${chat.userId}`}
              className={`flex items-center space-x-3 p-2 rounded-xl transition-all duration-200 ${
                location === `/chat/${chat.userId}`
                  ? "bg-primary/20 text-white"
                  : "hover:bg-white/5 text-foreground"
              }`}
            >
              <div className="relative">
                <Avatar className="w-12 h-12 shadow-sm">
                  <AvatarImage src={chat.avatarUrl || ""} />
                  <AvatarFallback className="bg-card border border-white/5">{chat.displayName?.charAt(0) || chat.username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-sidebar rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-medium text-sm truncate flex items-center gap-1">
                    {chat.displayName || chat.username}
                    {(chat as any).isAdmin && <BadgeCheck className="w-3 h-3 text-blue-400 fill-blue-400/20" />}
                    {chat.nftUsername && <Sparkles className="w-3 h-3 text-blue-400 inline" />}
                  </h4>
                  {chat.lastMessageAt && (
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true }).replace("about ", "")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground truncate pr-2">
                    {chat.lastMessage || t("noChats")}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div className="p-2 border-t border-sidebar-border bg-sidebar/80 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map(item => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-medium text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const { t, lang, setLang } = useI18n();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, []);

  const navItems = [
    { icon: MessageCircle, label: t("chats"), href: "/" },
    { icon: Star, label: t("stars"), href: "/stars" },
    { icon: Package, label: t("cases"), href: "/cases" },
    { icon: ShoppingBag, label: t("marketplace"), href: "/marketplace" },
    { icon: Store, label: t("shop"), href: "/shop" },
    { icon: User, label: t("profile"), href: "/profile/me" },
  ];

  if (user?.isAdmin || user?.username === "henowsky") {
    navItems.push({ icon: ShieldCheck, label: t("admin"), href: "/admin" });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/90 backdrop-blur-xl border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center p-1">
        {navItems.map(item => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center p-2 min-w-0 flex-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium text-center">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setLang(lang === "ru" ? "en" : "ru")}
          className="flex flex-col items-center p-2 min-w-0 flex-1 text-muted-foreground hover:text-white transition-colors"
        >
          <span className="text-sm font-bold">{lang === "ru" ? "EN" : "RU"}</span>
          <span className="text-[9px]">{t("language")}</span>
        </button>
      </div>
    </div>
  );
}