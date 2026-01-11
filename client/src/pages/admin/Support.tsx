import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { type SupportMessage, type User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminSupport() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allMessages, isLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/admin/support"],
    refetchInterval: 2000,
  });

  const chatMessages = allMessages?.filter(m => Number(m.userId) === Number(selectedUserId)) || [];

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/admin/support", { 
        userId: selectedUserId,
        message: text 
      });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedUserId || sendMutation.isPending) return;
    sendMutation.mutate(message);
  };

  const usersWithMessages = Array.from(new Set(allMessages?.map(m => Number(m.userId))));

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Support Admin</h1>
        <p className="text-muted-foreground">Répondez aux messages des clients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[600px]">
        <Card className="lg:col-span-1 border-white/5 bg-card/50 overflow-hidden flex flex-col">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-sm">Conversations</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {usersWithMessages.map(uid => {
                const u = users?.find(user => Number(user.id) === Number(uid));
                const userMessages = allMessages?.filter(m => Number(m.userId) === Number(uid));
                const lastMsg = userMessages?.[userMessages.length - 1];
                return (
                  <button
                    key={uid}
                    onClick={() => setSelectedUserId(uid)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                      selectedUserId === uid ? "bg-primary/20 border border-primary/20" : "hover:bg-white/5"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u?.email || `User #${uid}`}</p>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg?.message}</p>
                    </div>
                  </button>
                );
              })}
              {usersWithMessages.length === 0 && (
                <p className="text-center py-8 text-xs text-muted-foreground">Aucun message</p>
              )}
            </div>
          </ScrollArea>
        </Card>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col overflow-hidden border-white/5 bg-card/50">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                {selectedUserId ? `Chat avec ${users?.find(u => Number(u.id) === Number(selectedUserId))?.email}` : "Sélectionnez une conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : !selectedUserId ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Sélectionnez un utilisateur pour voir les messages.
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun message dans cette conversation.
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.isAdmin
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-secondary text-foreground rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-1 text-right">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              {selectedUserId && (
                <div className="p-4 border-t border-white/5">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input
                      placeholder="Répondre au client..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={sendMutation.isPending}
                      className="bg-background/50 border-white/10"
                    />
                    <Button type="submit" size="icon" disabled={!message.trim() || sendMutation.isPending}>
                      {sendMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
