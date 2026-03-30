import { AppLayout } from "@/components/layout/app-layout";
import { ShieldCheck, Check, X, Clock, Users, Star, Gift, Phone, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";

const GIFT_MODELS = [
  { model: "Diamond Ring", emoji: "💎", rarity: "legendary" },
  { model: "Golden Star", emoji: "⭐", rarity: "legendary" },
  { model: "Trophy Cup", emoji: "🏆", rarity: "legendary" },
  { model: "Magic Wand", emoji: "🪄", rarity: "rare" },
  { model: "Purple Heart", emoji: "💜", rarity: "rare" },
  { model: "Crystal Ball", emoji: "🔮", rarity: "rare" },
  { model: "Rocket Ship", emoji: "🚀", rarity: "common" },
  { model: "Fire Flame", emoji: "🔥", rarity: "common" },
  { model: "Rainbow", emoji: "🌈", rarity: "common" },
  { model: "Gift Box", emoji: "🎁", rarity: "common" },
];

const TYPE_LABELS: Record<string, string> = {
  stars: "Звёзды ⭐",
  nft_username: "NFT Юзернейм",
  anon_number: "Аноним. номер",
  nft_gift: "NFT Подарок",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Admin() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [me, setMe] = useState<any>(null);
  const [isMeLoading, setIsMeLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  const [starsAmount, setStarsAmount] = useState<Record<number, string>>({});
  const [newNftUsername, setNewNftUsername] = useState("");
  const [newNftUsernameForUser, setNewNftUsernameForUser] = useState("");
  const [giftForUser, setGiftForUser] = useState("");
  const [selectedGiftModel, setSelectedGiftModel] = useState(GIFT_MODELS[0].model);
  const [selectedGiftRarity, setSelectedGiftRarity] = useState("legendary");
  const [numberForUser, setNumberForUser] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "approved" | "rejected">("all");

  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

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
      } finally {
        setIsMeLoading(false);
      }
    };
    fetchMe();
  }, []);

  // Загрузка запросов
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/admin/requests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReqLoading(false);
    }
  };

  // Загрузка пользователей
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (me?.isAdmin) {
      fetchRequests();
      fetchUsers();
    }
  }, [me]);

  useEffect(() => {
    if (!isMeLoading && me && !me.isAdmin) setLocation("/");
  }, [me, isMeLoading, setLocation]);

  const handleApprove = async (id: number) => {
    setPendingActions(prev => ({ ...prev, [`approve_${id}`]: true }));
    try {
      const res = await fetch(`/api/admin/requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ Запрос одобрен" });
        fetchRequests();
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPendingActions(prev => ({ ...prev, [`approve_${id}`]: false }));
    }
  };

  const handleReject = async (id: number) => {
    setPendingActions(prev => ({ ...prev, [`reject_${id}`]: true }));
    try {
      const res = await fetch(`/api/admin/requests/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "❌ Запрос отклонён" });
        fetchRequests();
      } else {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPendingActions(prev => ({ ...prev, [`reject_${id}`]: false }));
    }
  };

  const handleAddStars = async (userId: number) => {
    const amount = parseInt(starsAmount[userId] || "0");
    if (!amount) return;
    setPendingActions(prev => ({ ...prev, [`stars_${userId}`]: true }));
    try {
      const res = await fetch(`/api/admin/users/${userId}/stars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: `✅ Добавлено ${amount} ⭐` });
        setStarsAmount(prev => ({ ...prev, [userId]: "" }));
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPendingActions(prev => ({ ...prev, [`stars_${userId}`]: false }));
    }
  };

  const handleCreateNftUsername = async () => {
    if (!newNftUsername || !newNftUsernameForUser) return;
    const user = allUsers?.find(u => u.username === newNftUsernameForUser || u.username === newNftUsernameForUser.replace("@", ""));
    if (!user) { toast({ title: "Пользователь не найден", variant: "destructive" }); return; }
    setPendingActions(prev => ({ ...prev, createUsername: true }));
    try {
      const res = await fetch("/api/admin/nft/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username: newNftUsername }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ NFT юзернейм создан" });
        setNewNftUsername("");
        setNewNftUsernameForUser("");
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPendingActions(prev => ({ ...prev, createUsername: false }));
    }
  };

  const handleCreateGift = async () => {
    if (!giftForUser) return;
    const user = allUsers?.find(u => u.username === giftForUser || u.username === giftForUser.replace("@", ""));
    if (!user) { toast({ title: "Пользователь не найден", variant: "destructive" }); return; }
    setPendingActions(prev => ({ ...prev, createGift: true }));
    try {
      const res = await fetch("/api/admin/nft/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, model: selectedGiftModel, rarity: selectedGiftRarity }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ NFT подарок создан" });
        setGiftForUser("");
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPendingActions(prev => ({ ...prev, createGift: false }));
    }
  };

  const handleCreateNumber = async () => {
    if (!numberForUser) return;
    const user = allUsers?.find(u => u.username === numberForUser || u.username === numberForUser.replace("@", ""));
    if (!user) { toast({ title: "Пользователь не найден", variant: "destructive" }); return; }
    setPendingActions(prev => ({ ...prev, createNumber: true }));
    try {
      const res = await fetch("/api/admin/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "✅ Номер создан" });
        setNumberForUser("");
        fetchUsers();
      } else {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setPendingActions(prev => ({ ...prev, createNumber: false }));
    }
  };

  if (isMeLoading) return <AppLayout><div className="p-8 text-center text-muted-foreground">Загрузка...</div></AppLayout>;
  if (!me?.isAdmin) return null;

  const pending = requests?.filter(r => r.status === "pending") || [];
  const history = requests?.filter(r => r.status !== "pending") || [];
  const filteredHistory = historyFilter === "all" ? history : history.filter(r => r.status === historyFilter);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("adminPanel")}</h1>
              <p className="text-muted-foreground text-sm">henowsky — администратор KlifGram</p>
            </div>
            <div className="ml-auto flex gap-2 text-sm flex-wrap">
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-medium border border-yellow-500/20">
                {pending.length} ожидают
              </span>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-medium border border-blue-500/20">
                {allUsers?.length || 0} польз.
              </span>
            </div>
          </div>

          <Tabs defaultValue="requests">
            <TabsList className="bg-card border border-card-border mb-6 w-full grid grid-cols-4">
              <TabsTrigger value="requests" className="gap-1.5 text-sm">
                <Clock className="w-3.5 h-3.5" /> {t("requests")}
                {pending.length > 0 && (
                  <span className="bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pending.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-sm">
                <ChevronDown className="w-3.5 h-3.5" /> {t("history")}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-sm">
                <Users className="w-3.5 h-3.5" /> {t("users")}
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-1.5 text-sm">
                <Gift className="w-3.5 h-3.5" /> Создать
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                {reqLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
                ) : pending.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Нет ожидающих запросов</p>
                  </div>
                ) : (
                  <div className="divide-y divide-card-border">
                    {pending.map(req => (
                      <div key={req.id} className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:bg-white/[0.02]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-white">{req.displayName}</span>
                            <span className="text-sm text-muted-foreground">@{req.username}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS["pending"]}`}>
                              {TYPE_LABELS[req.type] || req.type}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2 mt-1 border-l-2 border-primary/40">
                            {req.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(req.createdAt), "d MMM yyyy, HH:mm")}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleReject(req.id)} disabled={pendingActions[`reject_${req.id}`]}>
                            <X className="w-4 h-4 mr-1" /> {t("reject")}
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white"
                            onClick={() => handleApprove(req.id)} disabled={pendingActions[`approve_${req.id}`]}>
                            <Check className="w-4 h-4 mr-1" /> {t("approve")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="flex gap-2 mb-4">
                {(["all","approved","rejected"] as const).map(f => (
                  <button key={f} onClick={() => setHistoryFilter(f)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${historyFilter === f ? "bg-primary text-white" : "bg-card border border-card-border text-muted-foreground hover:text-white"}`}>
                    {f === "all" ? "Все" : f === "approved" ? "Одобрены" : "Отклонены"}
                  </button>
                ))}
              </div>
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                {filteredHistory.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">История пуста</div>
                ) : (
                  <div className="divide-y divide-card-border">
                    {filteredHistory.map(req => (
                      <div key={req.id} className="p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">{req.displayName}</span>
                            <span className="text-xs text-muted-foreground">@{req.username}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status]}`}>
                              {TYPE_LABELS[req.type] || req.type}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status]}`}>
                              {req.status === "approved" ? "Одобрен" : "Отклонён"}
                            </span>
                          </div>
                          <p className="text-xs text-white/60 mt-1 bg-white/5 rounded px-2 py-1">{req.details}</p>
                          {req.resolvedAt && <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(req.resolvedAt), "d MMM yyyy, HH:mm")}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                {usersLoading ? (
                  <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
                ) : (
                  <div className="divide-y divide-card-border">
                    {allUsers?.map(user => (
                      <div key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white">{user.displayName}</span>
                            <span className="text-sm text-muted-foreground">@{user.username}</span>
                            {user.isAdmin && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">ADMIN</span>}
                            <span className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-green-400" : "bg-gray-500"}`} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{user.stars?.toLocaleString() || 0}</span>
                            {user.nftUsername && <span className="text-blue-400">NFT: @{user.nftUsername}</span>}
                            {user.anonNumber && <span className="text-purple-400">{user.anonNumber}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input className="w-24 h-8 text-sm bg-background border-white/10" placeholder="звёзды" type="number"
                            value={starsAmount[user.id] || ""} onChange={e => setStarsAmount(prev => ({ ...prev, [user.id]: e.target.value }))} />
                          <Button size="sm" className="h-8 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                            onClick={() => handleAddStars(user.id)} disabled={pendingActions[`stars_${user.id}`]}>
                            <Star className="w-3 h-3 mr-1" /> Дать
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="create">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-card-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">NFT Юзернейм</h3>
                  </div>
                  <Input placeholder="@юзернейм" className="bg-background border-white/10 mb-2 text-sm" value={newNftUsername} onChange={e => setNewNftUsername(e.target.value)} />
                  <Input placeholder="@пользователь" className="bg-background border-white/10 mb-3 text-sm" value={newNftUsernameForUser} onChange={e => setNewNftUsernameForUser(e.target.value)} />
                  <Button size="sm" className="w-full" onClick={handleCreateNftUsername} disabled={pendingActions.createUsername}>Создать</Button>
                </div>
                <div className="bg-card border border-card-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-orange-400" />
                    <h3 className="font-semibold text-white">NFT Подарок</h3>
                  </div>
                  <Input placeholder="@пользователь" className="bg-background border-white/10 mb-2 text-sm" value={giftForUser} onChange={e => setGiftForUser(e.target.value)} />
                  <select className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm text-white mb-2"
                    value={selectedGiftModel} onChange={e => { setSelectedGiftModel(e.target.value); const g = GIFT_MODELS.find(m => m.model === e.target.value); if (g) setSelectedGiftRarity(g.rarity); }}>
                    {GIFT_MODELS.map(g => <option key={g.model} value={g.model}>{g.emoji} {g.model}</option>)}
                  </select>
                  <select className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm text-white mb-3"
                    value={selectedGiftRarity} onChange={e => setSelectedGiftRarity(e.target.value)}>
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="legendary">Legendary</option>
                  </select>
                  <Button size="sm" className="w-full" onClick={handleCreateGift} disabled={pendingActions.createGift}>Создать</Button>
                </div>
                <div className="bg-card border border-card-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Phone className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Анон. номер</h3>
                  </div>
                  <Input placeholder="@пользователь" className="bg-background border-white/10 mb-3 text-sm" value={numberForUser} onChange={e => setNumberForUser(e.target.value)} />
                  <Button size="sm" className="w-full" onClick={handleCreateNumber} disabled={pendingActions.createNumber}>Создать</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}