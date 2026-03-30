import { useState, useEffect } from "react";
import { Package, Gift, Tag, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: number;
  itemType: "nft_gift" | "nft_username" | "anon_number";
  name?: string;
  emoji?: string;
  rarity?: string;
  username?: string;
  number?: string;
  model?: string;
  price?: number;
}

export function Inventory() {
  const [me, setMe] = useState<any>(null);
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

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

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory", { credentials: "include" });
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me && open) {
      fetchInventory();
    }
  }, [me, open]);

  const handleActivate = async (itemId: number, itemType: string, value: string) => {
    setActivatingId(itemId);
    try {
      const res = await fetch("/api/inventory/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, itemType, value }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "✅ Предмет активирован в профиле!" });
        // Обновляем данные пользователя
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const newMe = await meRes.json();
          setMe(newMe);
        }
        fetchInventory();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Ошибка", description: "Не удалось активировать", variant: "destructive" });
    } finally {
      setActivatingId(null);
    }
  };

  const giftItems = items.filter(i => i.itemType === "nft_gift");
  const usernameItems = items.filter(i => i.itemType === "nft_username");
  const numberItems = items.filter(i => i.itemType === "anon_number");

  const ItemCard = ({ item }: { item: InventoryItem }) => {
    const displayName = item.username || item.number || item.name || item.model || "Предмет";
    const displayEmoji = item.emoji || (item.itemType === "nft_gift" ? "🎁" : item.itemType === "nft_username" ? "🏷️" : "📱");
    
    const isActive = 
      (item.itemType === "nft_username" && item.username === (me as any)?.activeNftUsername) ||
      (item.itemType === "nft_gift" && (item.name === (me as any)?.activeNftGift || item.model === (me as any)?.activeNftGift)) ||
      (item.itemType === "anon_number" && item.number === (me as any)?.activeAnonPhone);

    return (
      <div className="bg-gradient-to-br from-slate-800/60 to-gray-800/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:bg-slate-800/80 transition-all">
        <div className="text-center">
          <div className="text-5xl mb-2">{displayEmoji}</div>
          <h3 className="font-bold text-white text-sm truncate max-w-full">{displayName}</h3>
          {item.rarity && (
            <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
              item.rarity === "legendary" ? "bg-yellow-500/20 text-yellow-400" : 
              item.rarity === "rare" ? "bg-blue-500/20 text-blue-400" : 
              "bg-slate-500/20 text-slate-400"
            }`}>
              {item.rarity === "legendary" ? "⭐ Легендарный" : item.rarity === "rare" ? "✨ Редкий" : "📦 Обычный"}
            </span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {!isActive ? (
            <Button 
              size="sm" 
              className="flex-1 h-9 text-sm bg-green-600 hover:bg-green-500"
              onClick={() => handleActivate(item.id, item.itemType, displayName)}
              disabled={activatingId === item.id}
            >
              {activatingId === item.id ? "..." : "👕 Надеть в профиль"}
            </Button>
          ) : (
            <Button size="sm" className="flex-1 h-9 text-sm bg-primary/60 cursor-default" disabled>
              <Check className="w-4 h-4 mr-1" /> Активно
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="gap-2 text-white hover:bg-white/10">
          <Package className="w-5 h-5" /> Инвентарь ({items.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-card-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-primary" /> Мой инвентарь
            <span className="text-sm text-muted-foreground ml-2">{items.length} предметов</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="mt-2">
          <TabsList className="bg-background border border-white/10 w-full grid grid-cols-4">
            <TabsTrigger value="all">Все ({items.length})</TabsTrigger>
            <TabsTrigger value="gifts">🎁 Подарки ({giftItems.length})</TabsTrigger>
            <TabsTrigger value="usernames">🏷️ Юзернеймы ({usernameItems.length})</TabsTrigger>
            <TabsTrigger value="numbers">📱 Номера ({numberItems.length})</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Загрузка инвентаря...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>У вас пока нет предметов</p>
              <p className="text-xs mt-1">Купите что-нибудь в магазине 🛍️</p>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </TabsContent>
              <TabsContent value="gifts" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {giftItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </TabsContent>
              <TabsContent value="usernames" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {usernameItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </TabsContent>
              <TabsContent value="numbers" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {numberItems.map(item => <ItemCard key={item.id} item={item} />)}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}