import { AppLayout } from "@/components/layout/app-layout";
import { Star, Gift, Users, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function Stars() {
  const [me, setMe] = useState<any>(null);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [isClaimingInvite, setIsClaimingInvite] = useState(false);
  const [invitee, setInvitee] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const handleDailyClaim = async () => {
    setIsClaimingDaily(true);
    try {
      const res = await fetch("/api/stars/daily", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Daily Stars Claimed!", description: `You received +${data.gained} ⭐` });
        fetchMe();
      } else {
        toast({ title: "Cannot claim", description: data.error || "Already claimed today.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsClaimingDaily(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitee) return;
    setIsClaimingInvite(true);
    try {
      const res = await fetch("/api/stars/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteeUsername: invitee }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Invite successful!", description: `You received +${data.gained} ⭐` });
        setInvitee("");
        fetchMe();
      } else {
        toast({ title: "Failed", description: data.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsClaimingInvite(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://klifgram.app/register?ref=${me?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Referral link copied!" });
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Hero Balance Card */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10">
              <Star className="w-64 h-64 fill-amber-400" />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-medium text-amber-500/80 uppercase tracking-widest mb-2">Your Balance</h1>
            <div className="flex items-center justify-center gap-4 text-5xl sm:text-7xl font-display font-bold text-white mb-8">
              <Star className="w-12 h-12 sm:w-16 sm:h-16 fill-amber-400 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              {me?.stars?.toLocaleString() || 0}
            </div>

            <Button 
              size="lg" 
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-lg px-8 shadow-lg shadow-amber-500/25 hover:-translate-y-1 transition-all"
              onClick={handleDailyClaim}
              disabled={isClaimingDaily}
            >
              <Gift className="w-5 h-5 mr-2" />
              {isClaimingDaily ? "Claiming..." : "Claim Daily Bonus"}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Invite Section */}
            <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-2">Invite Friends</h2>
              <p className="text-muted-foreground text-sm mb-6">Earn 500 ⭐ for every friend who joins using your link or code.</p>
              
              <div className="flex items-center gap-2 bg-background p-2 rounded-xl border border-white/5 mb-6">
                <code className="flex-1 px-2 text-sm text-white opacity-80 truncate">klifgram.app/ref/{me?.username}</code>
                <Button size="icon" variant="secondary" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              <form onSubmit={handleInvite} className="flex gap-2">
                <Input 
                  placeholder="Enter friend's username..." 
                  value={invitee}
                  onChange={e => setInvitee(e.target.value)}
                  className="bg-background border-white/10 h-10"
                />
                <Button type="submit" disabled={!invitee || isClaimingInvite}>
                  Claim
                </Button>
              </form>
            </div>

            {/* About Stars */}
            <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-4">What are Stars?</h2>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  KlifGram's native economy token.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Buy exclusive NFT Usernames (500 ⭐).
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Open Mystery Cases to win legendary items (100 ⭐).
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Spin the Fortune Wheel for daily prizes.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}