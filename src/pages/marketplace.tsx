import { AppLayout } from "@/components/layout/app-layout";
import { ShoppingBag, Star, Tag, Gift, Phone, Clock, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RARITY_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  legendary: { bg: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/40", text: "text-yellow-400" },
  rare: { bg: "from-blue-500/20 to-purple-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  common: { bg: "from-slate-500/10 to-gray-500/10", border: "border-slate-500/30", text: "text-slate-400" },
};

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

export default function Marketplace() {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [me, setMe] = useState<any>(null);
  const [myGifts, setMyGifts] = useState<any[]>([]);
  const [myUsernames, setMyUsernames] = useState<any[]>([]);
  const [myNumbers, setMyNumbers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [rentingId, setRentingId] = useState<number | null>(null);

  const [listModal, setListModal] = useState(false);
  const [listItemType, setListItemType] = useState<"nft_gift" | "nft_username" | "anon_number">("nft_gift");
  const [listItemId, setListItemId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("");
  const [listType, setListType] = useState<"sale" | "rent">("sale");
  const [rentDays, setRentDays] = useState("7");
  const [listingLoading, setListingLoading] = useState(false);

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

  // Загрузка инвентаря пользователя
  useEffect(() => {
    const fetchInventory = async () => {
      if (!me) return;
      try {
        const res = await fetch("/api/inventory", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setMyGifts(data.filter((i: any) => i.itemType === "nft_gift"));
          setMyUsernames(data.filter((i: any) => i.itemType === "nft_username"));
          setMyNumbers(data.filter((i: any) => i.itemType === "anon_number"));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInventory();
  }, [me]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/marketplace");
      setListings(data);
    } catch (e: any) {
      toast({ title: "Ошибка загрузки маркета", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleBuy = async (id: number) => {
    setBuyingId(id);
    try {
      const data = await apiFetch(`/api/marketplace/buy/${id}`, { method: "POST" });
      toast({ title: "✅ " + data.message });
      fetchListings();
      // Обновляем данные пользователя
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const newMe = await res.json();
        setMe(newMe);
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setBuyingId(null);
    }
  };

  const handleRent = async (id: number) => {
    setRentingId(id);
    try {
      const data = await apiFetch(`/api/marketplace/rent/${id}`, { method: "POST" });
      toast({ title: "✅ " + data.message });
      fetchListings();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setRentingId(null);
    }
  };

  const handleList = async () => {
    if (!listItemId || !listPrice) return;
    setListingLoading(true);
    try {
      await apiFetch("/api/marketplace/list", {
        method: "POST",
        body: JSON.stringify({
          itemType: listItemType,
          itemId: listItemId,
          price: parseInt(listPrice),
          listingType: listType,
          rentDurationDays: listType === "rent" ? parseInt(rentDays) : undefined,
        }),
      });
      toast({ title: "✅ Товар выставлен на маркет!" });
      setListModal(false);
      setListItemId(null);
      setListPrice("");
      fetchListings();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setListingLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await apiFetch(`/api/marketplace/${id}`, { method: "DELETE" });
      toast({ title: "✅ Объявление снято" });
      fetchListings();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const giftListings = listings.filter(l => l.itemType === "nft_gift");
  const usernameListings = listings.filter(l => l.itemType === "nft_username");
  const numberListings = listings.filter(l => l.itemType === "anon_number");
  const myListings = listings.filter(l => l.sellerId === me?.id);

  const availableItemsForList = () => {
    if (listItemType === "nft_gift") return myGifts?.map(g => ({ id: g.id, label: `${g.emoji} ${g.model} (${g.rarity})` })) || [];
    if (listItemType === "nft_username") return myUsernames?.map(u => ({ id: u.id, label: `@${u.username}` })) || [];
    if (listItemType === "anon_number") return myNumbers?.map(n => ({ id: n.id, label: n.number })) || [];
    return [];
  };

  const ListingCard = ({ listing }: { listing: any }) => {
    const isMine = listing.sellerId === me?.id;
    const rs = listing.rarity ? RARITY_STYLE[listing.rarity] || RARITY_STYLE.common : RARITY_STYLE.common;
    const isRent = listing.listingType === "rent";

    return (
      <div className={`bg-gradient-to-br ${rs.bg} border ${rs.border} rounded-2xl p-4 flex flex-col gap-3 hover:-translate-y-0.5 transition-transform`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {listing.itemType === "nft_gift" && (
              <div className="text-center">
                <div className="text-4xl mb-1">{listing.emoji}</div>
                <p className="font-bold text-white text-sm">{listing.model}</p>
                <p className={`text-xs ${rs.text} capitalize`}>{listing.rarity}</p>
              </div>
            )}
            {listing.itemType === "nft_username" && (
              <div>
                <Tag className="w-5 h-5 text-blue-400 mb-1" />
                <p className="font-bold text-blue-400 text-lg">@{listing.username}</p>
                <p className="text-xs text-muted-foreground">NFT юзернейм</p>
              </div>
            )}
            {listing.itemType === "anon_number" && (
              <div>
                <Phone className="w-5 h-5 text-purple-400 mb-1" />
                <p className="font-bold text-purple-400">{listing.number}</p>
                <p className="text-xs text-muted-foreground">Анон. номер</p>
              </div>
            )}
          </div>
          {isMine && (
            <Button size="sm" variant="ghost" className="w-7 h-7 p-0 text-red-400 hover:bg-red-500/10"
              onClick={() => handleCancel(listing.id)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
          <div>
            <div className="flex items-center gap-1 font-bold text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />{listing.price}
            </div>
            {isRent && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {listing.rentDurationDays} дней
              </p>
            )}
          </div>
          {!isMine ? (
            isRent ? (
              <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-500 text-white text-xs"
                onClick={() => handleRent(listing.id)} disabled={rentingId === listing.id}>
                {rentingId === listing.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <>{t("rent")}</>}
              </Button>
            ) : (
              <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-xs"
                onClick={() => handleBuy(listing.id)} disabled={buyingId === listing.id}>
                {buyingId === listing.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <>{t("buy")}</>}
              </Button>
            )
          ) : (
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">{isRent ? t("forRent") : t("forSale")}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">продавец: @{listing.sellerUsername}</p>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t("marketplace")}</h1>
                <p className="text-xs text-muted-foreground">NFT подарки, юзернеймы, анонимные номера</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                <Star className="w-4 h-4 fill-amber-400" />{me?.stars?.toLocaleString() || 0}
              </span>
              <Button size="sm" className="bg-primary text-white gap-1.5" onClick={() => setListModal(true)}>
                <Plus className="w-4 h-4" /> Продать
              </Button>
            </div>
          </div>

          <Tabs defaultValue="gifts">
            <TabsList className="bg-card border border-card-border mb-5 w-full grid grid-cols-4">
              <TabsTrigger value="gifts" className="gap-1.5 text-sm"><Gift className="w-3.5 h-3.5" /> Подарки ({giftListings.length})</TabsTrigger>
              <TabsTrigger value="usernames" className="gap-1.5 text-sm"><Tag className="w-3.5 h-3.5" /> Юзернеймы ({usernameListings.length})</TabsTrigger>
              <TabsTrigger value="numbers" className="gap-1.5 text-sm"><Phone className="w-3.5 h-3.5" /> Номера ({numberListings.length})</TabsTrigger>
              <TabsTrigger value="mine" className="gap-1.5 text-sm"><Star className="w-3.5 h-3.5" /> Мои ({myListings.length})</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Загрузка...
              </div>
            ) : (
              <>
                <TabsContent value="gifts">
                  {giftListings.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground">
                      <Gift className="w-14 h-14 mx-auto mb-3 opacity-20" />
                      <p>Нет подарков на маркете</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {giftListings.map(l => <ListingCard key={l.id} listing={l} />)}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="usernames">
                  {usernameListings.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground">
                      <Tag className="w-14 h-14 mx-auto mb-3 opacity-20" />
                      <p>Нет юзернеймов на маркете</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {usernameListings.map(l => <ListingCard key={l.id} listing={l} />)}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="numbers">
                  {numberListings.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground">
                      <Phone className="w-14 h-14 mx-auto mb-3 opacity-20" />
                      <p>Нет номеров на маркете</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {numberListings.map(l => <ListingCard key={l.id} listing={l} />)}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="mine">
                  {myListings.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground">
                      <ShoppingBag className="w-14 h-14 mx-auto mb-3 opacity-20" />
                      <p>Вы ничего не выставили на продажу</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {myListings.map(l => <ListingCard key={l.id} listing={l} />)}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      {/* List Item Modal */}
      <Dialog open={listModal} onOpenChange={setListModal}>
        <DialogContent className="bg-card border-card-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-bold text-white">Выставить на маркет</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Тип товара</label>
              <div className="grid grid-cols-3 gap-2">
                {(["nft_gift","nft_username","anon_number"] as const).map(type => (
                  <button key={type} onClick={() => { setListItemType(type); setListItemId(null); }}
                    className={`py-2 rounded-xl text-xs font-medium transition-all border ${listItemType === type ? "bg-primary border-primary text-white" : "bg-background border-white/10 text-muted-foreground hover:text-white"}`}>
                    {type === "nft_gift" ? "🎁 Подарок" : type === "nft_username" ? "@Юзернейм" : "📱 Номер"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Выберите товар</label>
              <select className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                value={listItemId || ""}
                onChange={e => setListItemId(parseInt(e.target.value) || null)}>
                <option value="">-- выберите --</option>
                {availableItemsForList().map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setListType("sale")}
                className={`py-2 rounded-xl text-xs font-medium transition-all border ${listType === "sale" ? "bg-primary border-primary text-white" : "bg-background border-white/10 text-muted-foreground"}`}>
                {t("forSale")}
              </button>
              <button onClick={() => setListType("rent")}
                className={`py-2 rounded-xl text-xs font-medium transition-all border ${listType === "rent" ? "bg-purple-600 border-purple-600 text-white" : "bg-background border-white/10 text-muted-foreground"}`}>
                {t("forRent")}
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("price")} ⭐</label>
              <Input type="number" placeholder="100" className="bg-background border-white/10 text-sm"
                value={listPrice} onChange={e => setListPrice(e.target.value)} />
            </div>
            {listType === "rent" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("rentDays")}</label>
                <Input type="number" placeholder="7" className="bg-background border-white/10 text-sm"
                  value={rentDays} onChange={e => setRentDays(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListModal(false)}>{t("cancel")}</Button>
            <Button onClick={handleList} disabled={!listItemId || !listPrice || listingLoading}>
              {listingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("listItem")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}