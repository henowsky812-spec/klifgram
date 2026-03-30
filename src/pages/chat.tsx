import { AppLayout } from "@/components/layout/app-layout";
import { useRoute } from "wouter";
import { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, SmilePlus, CheckCheck, Check, MoreVertical, Phone, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { format } from "date-fns";
import { socket } from "@/lib/socket";
import { Skeleton } from "@/components/ui/skeleton";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { notifyNewMessage, requestNotificationPermission } from "@/lib/notifications";
import { startActivityTracking } from "@/lib/activity";

// Звук уведомления
const playNotificationSound = () => {
  const audio = new Audio("/notification.mp3");
  audio.volume = 0.5;
  audio.play().catch(e => console.log("Sound play failed:", e));
};

export default function Chat() {
  const [, params] = useRoute("/chat/:userId");
  const userId = params?.userId ? parseInt(params.userId, 10) : 0;

  const [content, setContent] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [readStatus, setReadStatus] = useState<Record<number, boolean>>({});
  const [me, setMe] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatUser = users?.find(u => u.id === userId);
  const lastMessage = messages?.[messages.length - 1];

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

  // Загрузка списка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, []);

  // Загрузка сообщений
  useEffect(() => {
    if (!userId) return;
    setIsMessagesLoading(true);
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${userId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [userId]);

  // Request notification permission on mount
  useEffect(() => { requestNotificationPermission(); }, []);

  // Start activity tracking
  useEffect(() => {
    const stop = startActivityTracking((active: boolean) => {
      socket.emit("heartbeat", { active });
    });
    return stop;
  }, []);

  // Socket effects
  useEffect(() => {
    if (!userId || !me) return;
    socket.emit("join_room", { userId });

    const handleNewMessage = (msg: any) => {
      if (msg.senderId === userId || msg.receiverId === userId) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        
        if (msg.senderId === userId) {
          playNotificationSound();
          if (!document.hasFocus()) {
            notifyNewMessage(chatUser?.displayName || chatUser?.username || "User", msg.content);
          }
          socket.emit("messages_read", { fromUserId: userId });
        }
      }
    };

    const handleTyping = (data: { userId: number; typing: boolean }) => {
      if (data.userId !== userId) return;
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (data.typing) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };

    const handleMessagesRead = (data: { byUserId: number }) => {
      if (data.byUserId === userId) {
        setReadStatus(prev => ({ ...prev, [userId]: true }));
        setMessages(prev => prev.map(msg => 
          msg.senderId === me?.id ? { ...msg, isRead: true } : msg
        ));
      }
    };

    const handleUserStatus = (data: { userId: number }) => {
      if (data.userId === userId) {
        setUsers(prev => prev.map(u => 
          u.id === data.userId ? { ...u, isOnline: data.isOnline } : u
        ));
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_status", handleUserStatus);

    socket.emit("messages_read", { fromUserId: userId });

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_status", handleUserStatus);
    };
  }, [userId, me, chatUser]);

  // Прокрутка вниз
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    if (!userId) return;
    socket.emit("typing_start", { toUserId: userId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { toUserId: userId });
    }, 2000);
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? content.length;
      const end = input.selectionEnd ?? content.length;
      const newVal = content.slice(0, start) + emoji + content.slice(end);
      setContent(newVal);
      setTimeout(() => {
        input.setSelectionRange(start + emoji.length, start + emoji.length);
        input.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userId || isSending) return;
    const msgContent = content;
    setContent("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing_stop", { toUserId: userId });
    setReadStatus(prev => ({ ...prev, [userId]: false }));
    setIsSending(true);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId, content: msgContent }),
        credentials: "include",
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        socket.emit("send_message", { room: [me?.id, userId].sort().join('-'), message: newMsg });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (!userId) return <AppLayout><div>Invalid User</div></AppLayout>;

  const isPartnerTyping = typingUsers.has(userId);
  const isPartnerRead = readStatus[userId] || false;

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background/95 relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-card-border bg-card/90 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link href="/" className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Link href={`/profile/${chatUser?.username}`} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <Avatar className="w-10 h-10 border border-white/10 group-hover:opacity-80">
                  <AvatarImage src={(chatUser as any)?.avatarUrl || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-700/30 text-white font-bold text-xl">
                    {(chatUser as any)?.avatarEmoji || chatUser?.displayName?.[0]?.toUpperCase() || chatUser?.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${(chatUser as any)?.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
              </div>
              <div>
                <div className="font-semibold text-white text-sm leading-tight">
                  {chatUser?.displayName || chatUser?.username}
                  {(chatUser as any)?.nftUsername && (
                    <span className="ml-1.5 text-[10px] text-primary font-bold">@{(chatUser as any).nftUsername}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {isPartnerTyping ? (
                    <span className="text-primary animate-pulse">печатает...</span>
                  ) : (chatUser as any)?.isOnline ? (
                    <span className="text-green-400">онлайн</span>
                  ) : (chatUser as any)?.lastSeen ? (
                    `был(а) ${format(new Date((chatUser as any).lastSeen), 'HH:mm')}`
                  ) : "оффлайн"}
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground hover:text-white">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground hover:text-white">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full text-muted-foreground hover:text-white">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ minHeight: 0 }}>
          {isMessagesLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                  <Skeleton className="h-10 w-48 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : (
            messages.map((msg: any, index: number) => {
              const isMe = msg.senderId === me?.id;
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
              const isLast = index === messages.length - 1;
              const isRead = msg.isRead || (isLast && isMe && isPartnerRead);

              return (
                <div key={msg.id} className="flex flex-col">
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-card/50 backdrop-blur text-xs px-3 py-1 rounded-full text-muted-foreground">
                        {format(new Date(msg.createdAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                        : 'bg-card text-card-foreground border border-white/5 rounded-2xl rounded-bl-sm'
                    }`}>
                      <span className="break-words">{msg.content}</span>
                      <span className={`text-[10px] float-right mt-2 ml-3 flex items-center gap-0.5 opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.createdAt), 'HH:mm')}
                        {isMe && (
                          isRead
                            ? <CheckCheck className="w-3.5 h-3.5 text-blue-300 ml-0.5" />
                            : <Check className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing bubble */}
          {isPartnerTyping && (
            <div className="flex self-start items-end gap-2">
              <div className="px-4 py-3 bg-card border border-white/5 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-card/80 backdrop-blur border-t border-card-border z-20">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center gap-2">
            <div className="relative flex-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-muted-foreground hover:text-primary z-10"
                onClick={() => setShowEmojiPicker(prev => !prev)}
              >
                <SmilePlus className="w-5 h-5" />
              </Button>

              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 left-0 z-50">
                  <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />
                </div>
              )}

              <Input
                ref={inputRef}
                value={content}
                onChange={handleInputChange}
                onKeyDown={e => { if (e.key === 'Escape') setShowEmojiPicker(false); }}
                placeholder="Сообщение..."
                className="w-full h-12 pl-10 pr-4 rounded-full bg-background border-border focus:border-primary text-[15px]"
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!content.trim() || isSending}
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 transition-transform active:scale-95 flex-shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}