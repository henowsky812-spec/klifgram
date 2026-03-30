import { AppLayout } from "@/components/layout/app-layout";
import { Phone, Plus, ShieldAlert, Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function Numbers() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [settingActive, setSettingActive] = useState<number | null>(null);
  const { toast } = useToast();

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

  // Загрузка номеров
  const fetchNumbers = async () => {
    try {
      const res = await fetch("/api/numbers", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNumbers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/numbers/create", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "✅ Анонимный номер создан!" });
        fetchNumbers();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActive = async (id: number, number: string) => {
    setSettingActive(id);
    try {
      const alreadyActive = me?.activeAnonNumberId === id;
      const res = await fetch("/api/users/active", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeAnonNumberId: alreadyActive ? null : id }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: alreadyActive ? "Номер деактивирован" : `Активен: ${number}` });
        // Обновляем данные пользователя
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const newMe = await meRes.json();
          setMe(newMe);
        }
        fetchNumbers();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setSettingActive(null);
    }
  };

  const handleListOnMarket = async (id: number) => {
    toast({ title: "Скоро", description: "Листинг на маркетплейс будет доступен." });
  };

  const activeId = me?.activeAnonNumberId;

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 rounded-3xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10">
              <Phone className="w-64 h-64 text-purple-400" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
                <Phone className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">Анонимные номера</h1>
              <p className="text-purple-200/70 max-w-lg mb-8 text-lg">
                Войдите в KlifGram без SIM-карты. Защитите приватность с номером +888 на блокчейне.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold shadow-lg shadow-purple-500/25"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {isCreating ? "Генерируем..." : "Получить номер"}
                </Button>
                <Link href="/shop">
                  <Button size="lg" variant="outline" className="rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                    <Tag className="w-4 h-4 mr-2" />
                    Купить в магазине
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white px-2">Ваши номера</h2>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Загрузка...</div>
            ) : !numbers?.length ? (
              <div className="bg-card border border-card-border p-8 rounded-2xl text-center flex flex-col items-center">
                <ShieldAlert className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
                <p className="text-muted-foreground">У вас пока нет анонимных номеров.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {numbers?.map((num: any) => {
                  const isActive = activeId === num.id;
                  return (
                    <div key={num.id}
                      className={`bg-card border rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${isActive ? 'border-purple-500/60 shadow-lg shadow-purple-500/10' : 'border-card-border'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-2xl font-display font-bold tracking-widest text-white mb-1">
                            {num.number?.replace(/(\+\d{3})(\d{3,4})(\d+)/, '$1 $2 $3') || num.number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Получен {format(new Date(num.createdAt), 'd MMM yyyy')}
                          </div>
                        </div>
                        {isActive && (
                          <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 font-semibold">
                            <Check className="w-3 h-3" /> Активен
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isActive ? "outline" : "default"}
                          className={`flex-1 h-8 text-xs font-semibold ${isActive ? "border-purple-500/30 text-purple-400" : "bg-purple-600 hover:bg-purple-500"}`}
                          onClick={() => handleSetActive(num.id, num.number)}
                          disabled={settingActive === num.id}
                        >
                          {isActive ? "Деактивировать" : "Использовать"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground hover:text-white border border-white/10"
                          onClick={() => handleListOnMarket(num.id)}
                        >
                          Продать
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}