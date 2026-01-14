import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { type SupportMessage } from "@shared/schema";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";

export default function Support() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support"],
    refetchInterval: 2000,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/support", { message: text });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/support"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Support Client</h1>
        <p className="text-muted-foreground">Notre équipe est là pour vous aider 24/7.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col overflow-hidden border-white/5 bg-card/50">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Discussion avec le support
                <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ticket Ouvert</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : messages?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Posez votre question pour démarrer la discussion.
                    </div>
                  ) : (
                    messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            msg.isAdmin
                              ? "bg-secondary text-foreground rounded-tl-none"
                              : "bg-primary text-primary-foreground rounded-tr-none"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-[10px] opacity-70 mt-1">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/5">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    placeholder="Votre message..."
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
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/5 bg-card/50 p-6">
            <h3 className="font-bold mb-4">Besoin d'aide immédiate ?</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex flex-col gap-1">
                <p className="text-foreground font-medium">Email Support</p>
                <p>support@blockmint.io</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-foreground font-medium">Temps de réponse</p>
                <p>Moins de 12 heures</p>
              </div>
              <p className="pt-4 border-t border-white/5">
                Pour toute question urgente concernant un règlement, n'oubliez pas de mentionner votre numéro de ticket de transaction.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
