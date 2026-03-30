import { AppLayout } from "@/components/layout/app-layout";
import { useRoute, Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Package, ShieldCheck, MessageCircle, BadgeCheck, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const RARITY_STYLE: Record<string, string> = {
  legendary: "from-yellow-500 via-orange-400 to-amber-500",
  rare: "from-blue-500 via-purple-500 to-indigo-500",
  common: "from-slate-500 via-gray-500 to-slate-600",
};

export default function Profile() {
  const { t } = useI18n();
  const [, params] = useRoute("/profile/:username");
  const isMePage = params?.username === "me";
  const [, setLocation] = useLocation();
  
  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myGifts, setMyGifts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestModal, setRequestModal] = useState<{
    isOpen: boolean;
    type: "stars" | "nft_username" | "anon_number" | "nft_gift" | null;
  }>({ isOpen: false, type: null });
  const [requestDetails, setRequestDetails] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const { toast } = useToast();

  const targetUsername = isMePage ? me?.username : params?.username;
  const isAdminProfile = profile?.username === "henowsky" || profile?.isAdmin;
  const isMyProfile = me?.id === profile?.id;

  // Загрузка текущего пользователя
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setMe(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, []);

  // Загрузка профиля
  useEffect(() => {
    if (!targetUsername) return;
    setIsLoading(true);
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${targetUsername}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [targetUsername]);

  // Загрузка подарков (только для своего профиля)
  useEffect(() => {
    if (!isMePage || !me) return;
    const fetchGifts = async () => {
      try {
        const res = await fetch("/api/nft/gifts", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setMyGifts(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGifts();
  }, [isMePage, me]);

  const handleRequest = async () => {
    if (!requestModal.type || !requestDetails.trim()) return;
    setIsSendingRequest(true);
    try {
      const res = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: requestModal.type, details: requestDetails }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ " + t("requestSent") });
        setRequestModal({ isOpen: false, type: null });
        setRequestDetails("");
      } else {
        const error = await res.json();
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const openRequest = (type: typeof requestModal.type) => {
    setRequestDetails("");
    setRequestModal({ isOpen: true, type });
  };

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-full text-muted-foreground">Загрузка...</div></AppLayout>;
  if (!profile) return <AppLayout><div className="flex items-center justify-center h-full text-muted-foreground">Пользователь не найден</div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background pb-8">
        <div className="h-44 bg-gradient-to-r from-primary/50 via-blue-900/40 to-purple-900/30 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-card rounded-2xl p-6 shadow-xl border border-card-border mb-5">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-end mb-5 -mt-12 sm:-mt-8">
              <Avatar className="w-28 h-28 border-4 border-card shadow-2xl flex-shrink-0">
                <AvatarImage src={profile.avatarUrl || ""} />
                <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                  {(profile as any).avatarEmoji || profile.displayName?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{profile.displayName || profile.username}</h1>
                  {(profile.isAdmin || profile.username === "henowsky") && (
                    <BadgeCheck className="w-6 h-6 text-blue-400 fill-blue-400/20" title={t("verified")} />
                  )}
                </div>
                <p className="text-muted-foreground">
                  @{profile.nftUsername ? (
                    <span className="text-blue-400 font-medium">{profile.nftUsername}</span>
                  ) : profile.username}
                </p>
                {profile.anonNumber && (
                  <p className="text-purple-400 text-sm flex items-center gap-1 justify-center sm:justify-start mt-0.5">
                    <Phone className="w-3 h-3" /> {profile.anonNumber}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 justify-center sm:justify-start flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile.isOnline ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-gray-500/20 text-gray-400 border border-gray-500/30"}`}>
                    {profile.isOnline ? "● " + t("online") : t("offline")}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />{profile.stars?.toLocaleString() || 0}
                  </span>
                  {(profile.isAdmin || profile.username === "henowsky") && (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {t("admin2")}
                    </span>
                  )}
                </div>
              </div>
              {!isMyProfile && (
                <Button className="sm:self-end" onClick={() => setLocation(`/chat/${profile.id}`)}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Написать
                </Button>
              )}
            </div>

            {/* Admin Request Buttons — shown on admin profile to non-admins */}
            {isAdminProfile && !isMyProfile && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-white/5">
                <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm h-9"
                  onClick={() => openRequest("stars")}>
                  {t("requestStars")}
                </Button>
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm h-9"
                  onClick={() => openRequest("nft_username")}>
                  {t("requestNftUsername")}
                </Button>
                <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm h-9"
                  onClick={() => openRequest("anon_number")}>
                  {t("requestAnonNumber")}
                </Button>
                <Button variant="outline" className="border-pink-500/30 text-pink-400 hover:bg-pink-500/10 text-sm h-9"
                  onClick={() => openRequest("nft_gift")}>
                  {t("requestNftGift")}
                </Button>
              </div>
            )}
          </div>

          {/* My Collection (visible on my profile) */}
          {isMePage && myGifts && myGifts.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-5 mb-5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> {t("myCollection")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {myGifts.map((gift: any) => (
                  <div key={gift.id} className={`p-0.5 rounded-2xl bg-gradient-to-br ${RARITY_STYLE[gift.rarity] || RARITY_STYLE.common}`}>
                    <div className="bg-card/95 rounded-[14px] p-3 text-center">
                      <div className="text-4xl mb-1">{gift.emoji}</div>
                      <p className="text-xs font-semibold text-white truncate">{gift.model}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{gift.rarity}</p>
                      {gift.isNft && <span className="text-[9px] text-blue-400 font-bold">NFT</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={requestModal.isOpen} onOpenChange={o => setRequestModal({ ...requestModal, isOpen: o })}>
        <DialogContent className="bg-card border-card-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {requestModal.type === "stars" && t("requestStars")}
              {requestModal.type === "nft_username" && t("requestNftUsername")}
              {requestModal.type === "anon_number" && t("requestAnonNumber")}
              {requestModal.type === "nft_gift" && t("requestNftGift")}
            </DialogTitle>
            <DialogDescription>Запрос будет отправлен администратору henowsky</DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <label className="text-sm text-muted-foreground mb-1.5 block">
              {requestModal.type === "stars" ? t("howMany") : t("whichOne")}
            </label>
            <Input
              value={requestDetails}
              onChange={e => setRequestDetails(e.target.value)}
              placeholder={requestModal.type === "stars" ? "Например: 500" : "Например: @cool_name"}
              className="bg-background border-white/10"
              onKeyDown={e => e.key === "Enter" && handleRequest()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestModal({ isOpen: false, type: null })}>
              {t("cancel")}
            </Button>
            <Button onClick={handleRequest} disabled={!requestDetails.trim() || isSendingRequest}>
              {isSendingRequest ? "..." : t("sendRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}