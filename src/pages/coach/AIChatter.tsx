import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bot, Sparkles, AlertTriangle, Send, Loader2, Check, X, Zap, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreators } from "@/hooks/useCreators";
import { toast } from "sonner";

interface QueuedMessage {
  id: string;
  fanName: string;
  fanMessage: string;
  suggestedReply: string;
  confidence: number;
  reason: string;
  timestamp: string;
}

interface AutoReplyRule {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

export default function AIChatter() {
  const navigate = useNavigate();
  const { creators } = useCreators();
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [testFanMessage, setTestFanMessage] = useState("");
  const [testingReply, setTestingReply] = useState(false);
  const [testResult, setTestResult] = useState<{
    autoReply: boolean;
    reply: string;
    confidence: number;
    reason: string;
  } | null>(null);

  const [queue, setQueue] = useState<QueuedMessage[]>([
    {
      id: "1", fanName: "Mike_88",
      fanMessage: "Hey babe, I really loved your last post. Can we do something special? I have a custom request 😏",
      suggestedReply: "Hey Mike! 💕 Thank you so much, that means a lot to me! I'd love to hear what you have in mind for a custom. DM me the details and I'll let you know what I can do! 😘",
      confidence: 62, reason: "Custom request detected — needs human review for pricing and boundaries", timestamp: "2 min ago",
    },
    {
      id: "2", fanName: "ShadowFan",
      fanMessage: "Can I get your personal number?",
      suggestedReply: "", confidence: 15,
      reason: "Boundary violation — requesting personal contact info", timestamp: "5 min ago",
    },
  ]);

  const [rules, setRules] = useState<AutoReplyRule[]>([
    { id: "1", trigger: "hey|hi|hello|what's up", response: "Hey babe! 💕 How's your day going?", isActive: true },
    { id: "2", trigger: "ppv|pay per view|unlock", response: "I've got some amazing exclusive content for you! Check your DMs 😘🔥", isActive: true },
    { id: "3", trigger: "tip|tipped|sent you", response: "Omg you're the sweetest! Thank you so much 💖 You just made my day!", isActive: true },
  ]);

  const testReply = async () => {
    if (!testFanMessage.trim()) { toast.error("Enter a fan message to test"); return; }
    setTestingReply(true);
    setTestResult(null);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-chatter", {
        body: {
          action: "generate_reply", fanMessage: testFanMessage,
          creatorName: creator?.name || "the creator", creatorPersona: creator?.persona || "",
          creatorBoundaries: "", confidenceThreshold,
        },
      });
      if (error) throw error;
      setTestResult(data);
    } catch { toast.error("Failed to generate reply"); } finally { setTestingReply(false); }
  };

  const approveMessage = (id: string) => { setQueue(prev => prev.filter(m => m.id !== id)); toast.success("Reply approved and sent"); };
  const rejectMessage = (id: string) => { setQueue(prev => prev.filter(m => m.id !== id)); toast.info("Message rejected"); };
  const toggleRule = (id: string) => { setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)); };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/of-ai")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Bot className="h-5 w-5 text-success" /> Marylin Monroe
              </h1>
              <p className="text-xs text-muted-foreground">Chatbot trainer & auto-reply configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-reply" className="text-xs">Auto-Reply</Label>
            <Switch id="auto-reply" checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            {autoReplyEnabled && <Badge className="bg-success text-success-foreground text-[10px]">LIVE</Badge>}
          </div>
        </div>

        {/* Creator Selector */}
        <Select value={selectedCreator} onValueChange={setSelectedCreator}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select creator" />
          </SelectTrigger>
          <SelectContent>
            {creators?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Tabs defaultValue="rules" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="rules" className="text-xs gap-1.5"><Zap className="h-3.5 w-3.5" /> Rules</TabsTrigger>
            <TabsTrigger value="test" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Sandbox</TabsTrigger>
            <TabsTrigger value="queue" className="text-xs gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Review
              {queue.length > 0 && <Badge variant="destructive" className="ml-1 h-4 min-w-4 text-[10px] px-1">{queue.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Rules */}
          <TabsContent value="rules" className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-muted-foreground">{rule.trigger}</p>
                  <p className="text-sm mt-0.5">{rule.response}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Sandbox */}
          <TabsContent value="test" className="space-y-4">
            <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Confidence threshold: {confidenceThreshold}%</Label>
              </div>
              <Input type="range" min={30} max={95} value={confidenceThreshold} onChange={e => setConfidenceThreshold(Number(e.target.value))} />
              <Textarea placeholder="Type a fan message to test..." value={testFanMessage} onChange={e => setTestFanMessage(e.target.value)} rows={2} className="resize-none" />
              <Button size="sm" onClick={testReply} disabled={testingReply}>
                {testingReply ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                {testingReply ? "Generating..." : "Test"}
              </Button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border ${testResult.autoReply ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    {testResult.autoReply ? <><Zap className="h-3.5 w-3.5 text-success" /> Auto-Reply</> : <><AlertTriangle className="h-3.5 w-3.5 text-warning" /> Queued</>}
                  </span>
                  <Badge variant={testResult.confidence >= confidenceThreshold ? "default" : "destructive"} className="text-[10px]">{testResult.confidence}%</Badge>
                </div>
                <p className="text-sm">{testResult.reply}</p>
                <p className="text-[11px] text-muted-foreground mt-2">{testResult.reason}</p>
              </div>
            )}
          </TabsContent>

          {/* Review Queue */}
          <TabsContent value="queue" className="space-y-3">
            {queue.length === 0 ? (
              <div className="py-10 text-center">
                <Check className="h-10 w-10 text-success mx-auto mb-2" />
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-muted-foreground">No messages need review</p>
              </div>
            ) : (
              queue.map(msg => (
                <div key={msg.id} className="p-4 rounded-lg border border-border/50 border-l-4 border-l-warning space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{msg.fanName}</Badge>
                      <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <Badge variant={msg.confidence > 50 ? "default" : "destructive"} className="text-[10px]">{msg.confidence}%</Badge>
                  </div>
                  <div className="bg-muted/50 rounded-md p-2.5">
                    <p className="text-xs">{msg.fanMessage}</p>
                  </div>
                  <p className="text-[11px] text-warning flex items-center gap-1.5"><AlertTriangle className="h-3 w-3 shrink-0" />{msg.reason}</p>
                  {msg.suggestedReply && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5">
                      <p className="text-xs">{msg.suggestedReply}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {msg.suggestedReply && (
                      <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => approveMessage(msg.id)}>
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rejectMessage(msg.id)}>
                      <X className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
