import { AppLayout } from "@/components/layout/app-layout";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Star, Sparkles, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

const SEGMENTS = [
  { label: "+50 ⭐", color: "#f59e0b", textColor: "#000", type: "stars_gain" },
  { label: "-10 ⭐", color: "#ef4444", textColor: "#fff", type: "stars_loss" },
  { label: "NFT Имя", color: "#3b82f6", textColor: "#fff", type: "nft_username" },
  { label: "+100 ⭐", color: "#f97316", textColor: "#000", type: "stars_gain" },
  { label: "Номер", color: "#8b5cf6", textColor: "#fff", type: "anon_number" },
  { label: "-20 ⭐", color: "#dc2626", textColor: "#fff", type: "stars_loss" },
  { label: "NFT Подарок", color: "#ec4899", textColor: "#fff", type: "nft_gift" },
  { label: "+30 ⭐", color: "#22c55e", textColor: "#000", type: "stars_gain" },
];

function FortuneWheel({ targetIndex, spinning, onSpinEnd }: { targetIndex: number | null; spinning: boolean; onSpinEnd: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number>();
  const startTimeRef = useRef<number | null>(null);
  const startRotRef = useRef(0);
  const targetRotRef = useRef(0);

  const drawWheel = (rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const segAngle = (Math.PI * 2) / SEGMENTS.length;

    ctx.clearRect(0, 0, size, size);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = rot + i * segAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = seg.textColor;
      ctx.font = `bold ${size < 350 ? 11 : 13}px Inter, sans-serif`;
      ctx.fillText(seg.label, radius - 12, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Inter";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎰", center, center);
  };

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation]);

  useEffect(() => {
    if (spinning && targetIndex !== null) {
      const segAngle = (Math.PI * 2) / SEGMENTS.length;
      const randomOffset = Math.random() * segAngle * 0.6;
      const targetRot = startRotRef.current + Math.PI * 8 + (Math.PI * 2 - (targetIndex * segAngle + segAngle / 2 + randomOffset));
      targetRotRef.current = targetRot;
      startRotRef.current = rotation;
      startTimeRef.current = null;

      const duration = 4000;

      const animate = (now: number) => {
        if (!startTimeRef.current) startTimeRef.current = now;
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentRot = startRotRef.current + (targetRotRef.current - startRotRef.current) * ease;
        setRotation(currentRot);
        drawWheel(currentRot);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          startRotRef.current = currentRot % (Math.PI * 2);
          onSpinEnd();
        }
      };

      animRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [spinning, targetIndex]);

  const size = 320;
  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
      </div>
      <div className="rounded-full overflow-hidden border-4 border-white/10 shadow-2xl shadow-black/60">
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
    </div>
  );
}

export default function Cases() {
  const { t } = useI18n();
  const { toast } = useToast();

  const [me, setMe] = useState<any>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [caseResult, setCaseResult] = useState<{ prize: string; type: string; starsGained?: number | null } | null>(null);

  const [spinning, setSpinning] = useState(false);
  const [spinTarget, setSpinTarget] = useState<number | null>(null);
  const [wheelResult, setWheelResult] = useState<{ prize: string; starsChange: number } | null>(null);
  const [pendingWheelResult, setPendingWheelResult] = useState<any>(null);
  const [isSpinningMutation, setIsSpinningMutation] = useState(false);
  const [isOpeningMutation, setIsOpeningMutation] = useState(false);

  // Загрузка текущего пользователя
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

  useEffect(() => {
    fetchMe();
  }, []);

  const handleOpenCase = async () => {
    if ((me?.stars || 0) < 100) {
      toast({ title: "Недостаточно звёзд", description: "Нужно 100 ⭐", variant: "destructive" });
      return;
    }
    setIsOpening(true);
    setIsOpeningMutation(true);
    setTimeout(async () => {
      try {
        const res = await fetch("/api/cases/open", {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setCaseResult({ prize: data.prize, type: data.prizeType, starsGained: data.starsGained });
          fetchMe();
        } else {
          toast({ title: "Ошибка", description: data.error, variant: "destructive" });
        }
      } catch (e: any) {
        toast({ title: "Ошибка", description: e.message, variant: "destructive" });
      } finally {
        setIsOpening(false);
        setIsOpeningMutation(false);
      }
    }, 1800);
  };

  const handleSpin = async (paid: boolean) => {
    if (spinning) return;
    if (paid && (me?.stars || 0) < 20) {
      toast({ title: "Недостаточно звёзд", description: "Нужно 20 ⭐", variant: "destructive" });
      return;
    }
    setIsSpinningMutation(true);
    try {
      const res = await fetch("/api/wheel/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setPendingWheelResult(data);
        setSpinTarget(data.segmentIndex);
        setSpinning(true);
        fetchMe();
      } else {
        toast({ title: "Ошибка", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setIsSpinningMutation(false);
    }
  };

  const handleSpinEnd = () => {
    setSpinning(false);
    if (pendingWheelResult) {
      setWheelResult({ prize: pendingWheelResult.prize, starsChange: pendingWheelResult.starsChange });
      setPendingWheelResult(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-7 h-7 text-primary" /> Казино и кейсы
            </h1>
            <div className="bg-card border border-card-border px-4 py-2 rounded-full flex items-center gap-2 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {me?.stars?.toLocaleString() || 0}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FORTUNE WHEEL */}
            <div className="bg-card border border-card-border rounded-2xl p-6 flex flex-col items-center gap-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">🎡 Колесо Фортуны</h2>
              <FortuneWheel targetIndex={spinTarget} spinning={spinning} onSpinEnd={handleSpinEnd} />
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 hover:bg-white/5 font-semibold"
                  onClick={() => handleSpin(false)}
                  disabled={spinning || isSpinningMutation}
                >
                  {spinning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {t("freeSpin")}
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 font-semibold"
                  onClick={() => handleSpin(true)}
                  disabled={spinning || isSpinningMutation}
                >
                  {t("paidSpin")}
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 w-full text-center">
                {SEGMENTS.map((s, i) => (
                  <div key={i} className="rounded-lg px-1 py-1.5 text-xs font-semibold" style={{ backgroundColor: s.color + "33", color: s.color, border: `1px solid ${s.color}44` }}>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* CASE */}
            <div className="bg-card border border-card-border rounded-2xl p-6 flex flex-col items-center gap-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">📦 Кейс KlifGram</h2>
              <motion.div
                className="w-48 h-48 rounded-3xl flex items-center justify-center cursor-pointer relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", border: "2px solid rgba(59,130,246,0.3)" }}
                whileHover={{ scale: 1.03 }}
                onClick={!isOpening ? handleOpenCase : undefined}
              >
                <AnimatePresence>
                  {isOpening ? (
                    <motion.div key="opening" initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 0.8, 1.1, 1], rotate: [0, 10, -10, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                      <Sparkles className="w-20 h-20 text-yellow-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                      <span className="text-7xl">📦</span>
                      <span className="text-xs text-blue-400 font-semibold">Нажмите чтобы открыть</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none" />
              </motion.div>

              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-bold text-lg py-5 rounded-xl"
                onClick={handleOpenCase} disabled={isOpening || isOpeningMutation || (me?.stars || 0) < 100}>
                {isOpening ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Открываем...</> : t("openCase")}
              </Button>

              <div className="w-full bg-background/50 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="font-semibold text-white mb-2">Возможные призы:</p>
                {[
                  { label: "+50–200 ⭐ Звёзды", pct: "60%", color: "text-amber-400" },
                  { label: "💜 NFT Подарок (обычный)", pct: "25%", color: "text-gray-400" },
                  { label: "🔮 NFT Подарок (редкий)", pct: "10%", color: "text-blue-400" },
                  { label: "💎 NFT Подарок (легендарный)", pct: "3%", color: "text-yellow-400" },
                  { label: "📱 Анонимный номер", pct: "2%", color: "text-purple-400" },
                ].map(p => (
                  <div key={p.label} className="flex justify-between items-center">
                    <span className={p.color}>{p.label}</span>
                    <span className="text-muted-foreground text-xs">{p.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wheel Prize Dialog */}
      <Dialog open={!!wheelResult} onOpenChange={() => setWheelResult(null)}>
        <DialogContent className="bg-card border-card-border text-center sm:max-w-sm">
          <div className="py-6 flex flex-col items-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              className="text-6xl mb-4">{wheelResult?.starsChange && wheelResult.starsChange > 0 ? "🎉" : wheelResult?.starsChange && wheelResult.starsChange < 0 ? "😢" : "🎁"}</motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("youWon")}</h2>
            <p className="text-xl text-primary font-medium">{wheelResult?.prize}</p>
            {wheelResult?.starsChange !== 0 && (
              <p className={`mt-2 font-semibold ${(wheelResult?.starsChange || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                {(wheelResult?.starsChange || 0) > 0 ? "+" : ""}{wheelResult?.starsChange} ⭐
              </p>
            )}
            <Button className="mt-6 rounded-full px-8" onClick={() => setWheelResult(null)}>{t("awesome")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Case Prize Dialog */}
      <Dialog open={!!caseResult} onOpenChange={() => setCaseResult(null)}>
        <DialogContent className="bg-card border-card-border text-center sm:max-w-sm">
          <div className="py-6 flex flex-col items-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="text-6xl mb-4">🎁</motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("youWon")}</h2>
            <p className="text-xl text-primary font-medium">{caseResult?.prize}</p>
            {caseResult?.starsGained && <p className="text-green-400 mt-2 font-semibold">+{caseResult.starsGained} ⭐</p>}
            <Button className="mt-6 rounded-full px-8" onClick={() => setCaseResult(null)}>{t("awesome")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}