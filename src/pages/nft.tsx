import { AppLayout } from "@/components/layout/app-layout";
import { Sparkles, Package, Tag, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const RARITY_GRADIENT: Record<string, string> = {
  legendary: "from-yellow-500 via-orange-400 to-amber-500",
  rare: "from-blue-500 via-purple-500 to-indigo-500",
  common: "from-slate-500 via-gray-500 to-slate-600",
};

const RARITY_LABEL: Record<string, string> = {
  legendary: "Легендарный",
  rare: "Редкий",
  common: "Обычный",
};

export default function NftPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [me, setMe] = useState<any>(null);
  const [usernames, setUsernames] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);
  const [isNamesLoading, setIsNamesLoading] = useState(true);
  const [isGiftsLoading, setIsGiftsLoading] = useState(true);
  const [isCreatingName, setIsCreatingName] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openedGift, setOpenedGift] = useState<any>(null);
  const [newName, setNewName] = useState("");

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

  // Загрузка NFT юзернеймов
  const fetchUsernames = async () => {
    try {
      const res = await fetch("/api/nft/usernames", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsernames(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNamesLoading(false);
    }
  };

  // Загрузка NFT подарков
  const fetchGifts = async () => {
    try {
      const res = await fetch("/api/nft/gifts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGifts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGiftsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsernames();
    fetchGifts();
  }, []);

  const handleCreateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    if ((me?.stars || 0) < 500) {
      toast({ title: "Недостаточно звёзд", description: "Нужно 500 ⭐", variant: "destructive" });
      return;
    }
    setIsCreatingName(true);
    try {
      const res = await fetch("/api/nft/usernames/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newName }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "✅ NFT юзернейм создан!" });
        setNewName("");
        fetchUsernames();
        // Обновляем данные пользователя
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const newMe = await meRes.json();
          setMe(newMe);
        }
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setIsCreatingName(false);
    }
  };

  const handleOpenGift = async (giftId: number) => {
    setOpeningId(giftId);
    try {
      const res = await fetch(`/api/nft/gifts/${giftId}/open`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setOpenedGift(data);
        fetchGifts();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NFT Коллекция</h1>
              <p className="text-xs text-muted-foreground">{t("nftUsernames")} и {t("nftGifts")}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-sm font-semibold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
              <Star className="w-4 h-4 fill-amber-400" />{me?.stars?.toLocaleString() || 0}
            </div>
          </div>

          <Tabs defaultValue="gifts">
            <TabsList className="bg-card border border-card-border mb-5 w-full grid grid-cols-2">
              <TabsTrigger value="gifts" className="gap-1.5"><Package className="w-4 h-4" /> {t("nftGifts")}</TabsTrigger>
              <TabsTrigger value="usernames" className="gap-1.5"><Tag className="w-4 h-4" /> {t("nftUsernames")}</TabsTrigger>
            </TabsList>

            <TabsContent value="gifts">
              {isGiftsLoading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка...
                </div>
              ) : gifts?.length === 0 ? (
                <div className="p-16 text-center">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-1">Нет подарков</h3>
                  <p className="text-muted-foreground text-sm">Откройте кейсы или попросите у henowsky!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {gifts?.map(gift => (
                    <motion.div key={gift.id} whileHover={{ y: -2 }}
                      className={`p-0.5 rounded-2xl bg-gradient-to-br ${RARITY_GRADIENT[gift.rarity] || RARITY_GRADIENT.common}`}>
                      <div className="bg-card/95 h-full rounded-[14px] p-4 flex flex-col items-center gap-2">
                        <div className="text-5xl drop-shadow-lg">{gift.emoji}</div>
                        <h4 className="font-bold text-sm text-white text-center">{gift.model}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${RARITY_GRADIENT[gift.rarity]} bg-clip-text text-transparent border border-white/10`}>
                          {RARITY_LABEL[gift.rarity] || gift.rarity}
                        </span>
                        {gift.isNft && <span className="text-[9px] text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded-full">✨ NFT</span>}
                        <p className="text-xs text-muted-foreground">от: {gift.fromUsername || "Системы"}</p>
                        {!gift.isOpened && (
                          <Button size="sm" className="w-full h-7 text-xs mt-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                            onClick={() => handleOpenGift(gift.id)} disabled={openingId === gift.id}>
                            {openingId === gift.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨ Открыть"}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="usernames">
              <div className="bg-card border border-card-border rounded-2xl p-5 mb-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-400" /> {t("createNftUsername")}
                  <span className="text-xs text-muted-foreground ml-1">— {t("cost500")}</span>
                </h3>
                <form onSubmit={handleCreateName} className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="@my_cool_name"
                    className="bg-background border-white/10 flex-1"
                  />
                  <Button type="submit" disabled={!newName || isCreatingName} className="gap-1">
                    {isCreatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Создать
                  </Button>
                </form>
              </div>

              {isNamesLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка...
                </div>
              ) : usernames?.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Tag className="w-14 h-14 mx-auto mb-3 opacity-20" />
                  <p>Нет NFT юзернеймов</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {usernames?.map(name => (
                    <div key={name.id} className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">NFT</span>
                        {name.isActive && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Активен</span>}
                      </div>
                      <h3 className="text-xl font-bold text-blue-400">@{name.username}</h3>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={!!openedGift} onOpenChange={() => setOpenedGift(null)}>
        <DialogContent className="bg-card border-card-border text-center sm:max-w-sm">
          {openedGift && (
            <div className="py-6 flex flex-col items-center">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="text-7xl mb-4">
                {openedGift.emoji}
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-1">Подарок открыт!</h2>
              <p className="text-lg text-primary font-medium">{openedGift.model}</p>
              <p className={`text-sm mt-1 capitalize font-semibold bg-gradient-to-r ${RARITY_GRADIENT[openedGift.rarity]} bg-clip-text text-transparent`}>
                {RARITY_LABEL[openedGift.rarity] || openedGift.rarity}
              </p>
              <div className="mt-3 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                <span className="text-blue-400 font-bold text-sm">✨ Теперь это NFT!</span>
              </div>
              <Button className="mt-5 rounded-full px-8" onClick={() => setOpenedGift(null)}>Отлично!</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}