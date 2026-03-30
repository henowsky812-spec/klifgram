import { AppLayout } from "@/components/layout/app-layout";
import { ShoppingCart, Star, Gift, Tag, Phone, Package, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const RARITY_STYLE: Record<string, { bg: string; border: string; badge: string; glow: string }> = {
  legendary: { bg: "from-yellow-900/30 to-orange-900/30", border: "border-yellow-500/40", badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", glow: "shadow-yellow-500/20" },
  rare: { bg: "from-blue-900/30 to-purple-900/30", border: "border-blue-500/40", badge: "bg-blue-500/20 text-blue-400 border-blue-500/30", glow: "shadow-blue-500/20" },
  common: { bg: "from-slate-800/30 to-gray-800/30", border: "border-slate-500/30", badge: "bg-slate-500/20 text-slate-400 border-slate-500/30", glow: "" },
};

const RARITY_LABEL: Record<string, string> = { legendary: "Легендарный", rare: "Редкий", common: "Обычный" };

const TYPE_ICON: Record<string, React.ComponentType<any>> = { nft_gift: Gift, nft_username: Tag, anon_number: Phone };
const TYPE_LABEL: Record<string, string> = { nft_gift: "NFT Подарок", nft_username: "NFT Юзернейм", anon_number: "Номер +888" };

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

const GIFT_MODELS = [
  { model: "Diamond Ring", emoji: "💎", rarity: "legendary", color: "#a78bfa" },
  { model: "Golden Star", emoji: "⭐", rarity: "legendary", color: "#f59e0b" },
  { model: "Trophy Cup", emoji: "🏆", rarity: "legendary", color: "#f97316" },
  { model: "Magic Wand", emoji: "🪄", rarity: "rare", color: "#8b5cf6" },
  { model: "Purple Heart", emoji: "💜", rarity: "rare", color: "#7c3aed" },
  { model: "Crystal Ball", emoji: "🔮", rarity: "rare", color: "#4f46e5" },
  { model: "Rocket Ship", emoji: "🚀", rarity: "common", color: "#6c757d" },
  { model: "Fire Flame", emoji: "🔥", rarity: "common", color: "#dc2626" },
  { model: "Rainbow", emoji: "🌈", rarity: "common", color: "#22c55e" },
  { model: "Gift Box", emoji: "🎁", rarity: "common", color: "#6c757d" },
];

export default function Shop() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [me, setMe] = useState<any>(null);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [adminItems, setAdminItems] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [newItemType, setNewItemType] = useState<"nft_gift" | "nft_username" | "anon_number">("nft_gift");
  const [newItemName, setNewItemName] = useState("");
  const [newItemEmoji, setNewItemEmoji] = useState("🎁");
  const [newItemRarity, setNewItemRarity] = useState("common");
  const [newItemPrice, setNewItemPrice] = useState("100");
  const [newItemStock, setNewItemStock] = useState("10");
  const [newItemNumberType, setNewItemNumberType] = useState<"long" | "short" | "custom">("long");
  const [newItemNumberValue, setNewItemNumberValue] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedGiftModel, setSelectedGiftModel] = useState(GIFT_MODELS[0].model);

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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/shop");
      setItems(data);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminItems = async () => {
    try {
      setAdminLoading(true);
      const data = await apiFetch("/api/shop/admin");
      setAdminItems(data);
    } catch {} finally { setAdminLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => { if (me?.isAdmin) fetchAdminItems(); }, [me?.isAdmin]);

  const handleBuy = async (id: number, price: number) => {
    if ((me?.stars || 0) < price) {
      toast({ title: "Недостаточно звёзд", description: `Нужно ${price} ⭐`, variant: "destructive" });
      return;
    }
    setBuyingId(id);
    try {
      const data = await apiFetch(`/api/shop/buy/${id}`, { method: "POST" });
      toast({ title: "✅ " + data.message });
      fetchItems();
      // Обновляем данные пользователя
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const newMe = await res.json();
        setMe(newMe);
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setBuyingId(null); }
  };

  const handleCreate = async () => {
    if (!newItemPrice) return;
    setCreateLoading(true);

    let name = newItemName;
    let emoji = newItemEmoji;
    let rarity = newItemRarity;

    if (newItemType === "nft_gift") {
      const gm = GIFT_MODELS.find(g => g.model === selectedGiftModel) || GIFT_MODELS[0];
      name = gm.model;
      emoji = gm.emoji;
      rarity = gm.rarity;
    } else if (newItemType === "anon_number") {
      if (newItemNumberType === "long") name = "Длинный номер +888";
      else if (newItemNumberType === "short") name = "Короткий номер +888";
      else name = newItemNumberValue || "Кастомный номер";
      emoji = "📱";
    } else {
      emoji = "🏷️";
      rarity = "common";
    }

    try {
      await apiFetch("/api/shop/admin", {
        method: "POST",
        body: JSON.stringify({
          itemType: newItemType,
          name,
          emoji,
          rarity,
          color: GIFT_MODELS.find(g => g.model === selectedGiftModel)?.color || "#6c757d",
          price: parseInt(newItemPrice),
          stock: parseInt(newItemStock),
          isCustomNumber: newItemNumberType === "custom",
          numberValue: newItemNumberType === "custom" ? newItemNumberValue : null,
        }),
      });
      toast({ title: "✅ Товар добавлен в магазин" });
      setCreateModal(false);
      setNewItemName(""); setNewItemPrice("100"); setNewItemStock("10");
      fetchItems(); fetchAdminItems();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setCreateLoading(false); }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await apiFetch(`/api/shop/admin/${id}`, { method: "DELETE" });
      toast({ title: "✅ Удалено" });
      fetchItems(); fetchAdminItems();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const giftItems = items.filter(i => i.itemType === "nft_gift");
  const usernameItems = items.filter(i => i.itemType === "nft_username");
  const numberItems = items.filter(i => i.itemType === "anon_number");

  const ItemCard = ({ item }: { item: any }) => {
    const rs = RARITY_STYLE[item.rarity] || RARITY_STYLE.common;
    const isOOS = item.stock <= 0;

    return (
      <div className={`bg-gradient-to-br ${rs.bg} border ${rs.border} rounded-2xl p-4 flex flex-col gap-3 shadow-lg ${rs.glow} transition-all hover:-translate-y-0.5`}>
        <div className="flex items-start justify-between">
          <div className="text-center flex-1">
            <div className="text-5xl mb-2">{item.emoji}</div>
            <h3 className="font-bold text-white text-sm leading-tight">{item.name}</h3>
            <div className="flex items-center gap-1 justify-center mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${rs.badge}`}>
                {RARITY_LABEL[item.rarity] || item.rarity}
              </span>
              <span className="text-[10px] text-muted-foreground">{TYPE_LABEL[item.itemType]}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Star className="w-4 h-4 fill-amber-400" />{item.price.toLocaleString()}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Осталось: {item.stock}</div>
          </div>
        </div>
        <Button
          size="sm"
          className={`w-full h-8 text-xs font-semibold ${isOOS ? "opacity-50 cursor-not-allowed" : "bg-primary hover:bg-primary/90"}`}
          onClick={() => handleBuy(item.id, item.price)}
          disabled={isOOS || buyingId === item.id}
        >
          {buyingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : isOOS ? "Нет в наличии" : `Купить за ${item.price} ⭐`}
        </Button>
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
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Магазин</h1>
                <p className="text-xs text-muted-foreground">NFT подарки, юзернеймы, анонимные номера</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                <Star className="w-4 h-4 fill-amber-400" />{me?.stars?.toLocaleString() || 0}
              </span>
              {me?.isAdmin && (
                <Button size="sm" className="gap-1.5" onClick={() => setCreateModal(true)}>
                  <Plus className="w-4 h-4" /> Добавить товар
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="gifts">
            <TabsList className="bg-card border border-card-border mb-5 w-full grid grid-cols-3">
              <TabsTrigger value="gifts" className="gap-1.5 text-sm"><Gift className="w-3.5 h-3.5" /> Подарки ({giftItems.length})</TabsTrigger>
              <TabsTrigger value="usernames" className="gap-1.5 text-sm"><Tag className="w-3.5 h-3.5" /> Юзернеймы ({usernameItems.length})</TabsTrigger>
              <TabsTrigger value="numbers" className="gap-1.5 text-sm"><Phone className="w-3.5 h-3.5" /> Номера ({numberItems.length})</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Загрузка...
              </div>
            ) : (
              <>
                {(["gifts","usernames","numbers"] as const).map((tab, i) => {
                  const tabItems = [giftItems, usernameItems, numberItems][i];
                  return (
                    <TabsContent key={tab} value={tab}>
                      {tabItems.length === 0 ? (
                        <div className="p-16 text-center text-muted-foreground">
                          <ShoppingCart className="w-14 h-14 mx-auto mb-3 opacity-20" />
                          <p>Нет товаров в этой категории</p>
                          {me?.isAdmin && <Button size="sm" className="mt-4" onClick={() => setCreateModal(true)}>Добавить товар</Button>}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {tabItems.map(item => <ItemCard key={item.id} item={item} />)}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </>
            )}
          </Tabs>

          {/* Admin: all items management */}
          {me?.isAdmin && adminItems.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-red-400" /> Управление товарами (Все)
              </h2>
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                <div className="divide-y divide-card-border">
                  {adminItems.map(item => (
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{TYPE_LABEL[item.itemType]} · {item.price} ⭐ · Склад: {item.stock}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "text-green-400 bg-green-500/20" : "text-red-400 bg-red-500/20"}`}>
                          {item.isActive ? "Активен" : "Скрыт"}
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 text-red-400 hover:bg-red-500/10 text-xs"
                          onClick={() => handleDeleteItem(item.id)}>Удалить</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Item Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="bg-card border-card-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-white">Добавить товар в магазин</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Тип товара</label>
              <div className="grid grid-cols-3 gap-2">
                {(["nft_gift","nft_username","anon_number"] as const).map(type => (
                  <button key={type} onClick={() => setNewItemType(type)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${newItemType === type ? "bg-primary border-primary text-white" : "bg-background border-white/10 text-muted-foreground hover:text-white"}`}>
                    {type === "nft_gift" ? "🎁 Подарок" : type === "nft_username" ? "🏷️ Юзернейм" : "📱 Номер"}
                  </button>
                ))}
              </div>
            </div>

            {newItemType === "nft_gift" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Модель подарка</label>
                <select className="w-full bg-background border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  value={selectedGiftModel} onChange={e => setSelectedGiftModel(e.target.value)}>
                  {GIFT_MODELS.map(g => <option key={g.model} value={g.model}>{g.emoji} {g.model} ({g.rarity})</option>)}
                </select>
              </div>
            )}

            {newItemType === "nft_username" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Юзернейм (без @)</label>
                <Input value={newItemName} onChange={e => setNewItemName(e.target.value)}
                  placeholder="cool_username" className="bg-background border-white/10 text-sm" />
              </div>
            )}

            {newItemType === "anon_number" && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Тип номера</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["long","short","custom"] as const).map(t => (
                      <button key={t} onClick={() => setNewItemNumberType(t)}
                        className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${newItemNumberType === t ? "bg-primary border-primary text-white" : "bg-background border-white/10 text-muted-foreground"}`}>
                        {t === "long" ? "+888XXXXXXXX" : t === "short" ? "+888XXX" : "Кастомный"}
                      </button>
                    ))}
                  </div>
                </div>
                {newItemNumberType === "custom" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Номер (+888...)</label>
                    <Input value={newItemNumberValue} onChange={e => setNewItemNumberValue(e.target.value)}
                      placeholder="+888123" className="bg-background border-white/10 text-sm" />
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Цена ⭐</label>
                <Input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                  className="bg-background border-white/10 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Количество</label>
                <Input type="number" value={newItemStock} onChange={e => setNewItemStock(e.target.value)}
                  className="bg-background border-white/10 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}