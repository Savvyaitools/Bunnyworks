import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, Bot, Sparkles, Shield, Clock, AlertTriangle,
  Send, Loader2, Check, X, Zap, UserCheck, BrainCircuit, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
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

  // Simulation state
  const [testFanMessage, setTestFanMessage] = useState("");
  const [testingReply, setTestingReply] = useState(false);
  const [testResult, setTestResult] = useState<{
    autoReply: boolean;
    reply: string;
    confidence: number;
    reason: string;
  } | null>(null);

  // Queue
  const [queue, setQueue] = useState<QueuedMessage[]>([
    {
      id: "1",
      fanName: "Mike_88",
      fanMessage: "Hey babe, I really loved your last post. Can we do something special? I have a custom request 😏",
      suggestedReply: "Hey Mike! 💕 Thank you so much, that means a lot to me! I'd love to hear what you have in mind for a custom. DM me the details and I'll let you know what I can do! 😘",
      confidence: 62,
      reason: "Custom request detected — needs human review for pricing and boundaries",
      timestamp: "2 min ago",
    },
    {
      id: "2",
      fanName: "ShadowFan",
      fanMessage: "Can I get your personal number?",
      suggestedReply: "",
      confidence: 15,
      reason: "Boundary violation — requesting personal contact info",
      timestamp: "5 min ago",
    },
  ]);

  const [rules, setRules] = useState<AutoReplyRule[]>([
    { id: "1", trigger: "hey|hi|hello|what's up", response: "Hey babe! 💕 How's your day going?", isActive: true },
    { id: "2", trigger: "ppv|pay per view|unlock", response: "I've got some amazing exclusive content for you! Check your DMs 😘🔥", isActive: true },
    { id: "3", trigger: "tip|tipped|sent you", response: "Omg you're the sweetest! Thank you so much 💖 You just made my day!", isActive: true },
  ]);

  const testReply = async () => {
    if (!testFanMessage.trim()) {
      toast.error("Enter a fan message to test");
      return;
    }
    setTestingReply(true);
    setTestResult(null);
    try {
      const creator = creators?.find(c => c.id === selectedCreator);
      const { data, error } = await supabase.functions.invoke("ai-chatter", {
        body: {
          action: "generate_reply",
          fanMessage: testFanMessage,
          creatorName: creator?.name || "the creator",
          creatorPersona: creator?.persona || "",
          creatorBoundaries: "",
          confidenceThreshold,
        },
      });
      if (error) throw error;
      setTestResult(data);
    } catch (err) {
      toast.error("Failed to generate reply");
      console.error(err);
    } finally {
      setTestingReply(false);
    }
  };

  const approveMessage = (id: string) => {
    setQueue(prev => prev.filter(m => m.id !== id));
    toast.success("Reply approved and sent");
  };

  const rejectMessage = (id: string) => {
    setQueue(prev => prev.filter(m => m.id !== id));
    toast.info("Message rejected — you can reply manually");
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/coach-pbf")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                Jodie
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI Chatter — auto-replies simple messages, flags complex ones for your review
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="auto-reply" className="text-sm">Auto-Reply</Label>
            <Switch id="auto-reply" checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            {autoReplyEnabled && <Badge className="bg-success text-success-foreground">LIVE</Badge>}
          </div>
        </div>

        {/* Creator Selector */}
        <Select value={selectedCreator} onValueChange={setSelectedCreator}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select creator" />
          </SelectTrigger>
          <SelectContent>
            {creators?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="queue" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Review Queue
              {queue.length > 0 && <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">{queue.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Test Reply
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5">
              <Zap className="h-4 w-4" /> Auto-Reply Rules
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1.5">
              <BrainCircuit className="h-4 w-4" /> Performance
            </TabsTrigger>
          </TabsList>

          {/* Review Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            {queue.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Check className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No messages need review right now</p>
                </CardContent>
              </Card>
            ) : (
              queue.map(msg => (
                <Card key={msg.id} className="border-l-4 border-l-warning">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{msg.fanName}</Badge>
                        <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <Badge variant={msg.confidence > 50 ? "default" : "destructive"}>
                        {msg.confidence}% confidence
                      </Badge>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Fan message:</p>
                      <p className="text-sm">{msg.fanMessage}</p>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-warning">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{msg.reason}</span>
                    </div>

                    {msg.suggestedReply && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <p className="text-xs text-primary mb-1">Suggested reply:</p>
                        <p className="text-sm">{msg.suggestedReply}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {msg.suggestedReply && (
                        <Button size="sm" onClick={() => approveMessage(msg.id)}>
                          <Check className="h-4 w-4 mr-1" /> Approve & Send
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => rejectMessage(msg.id)}>
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Test Reply Tab */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test AI Reply</CardTitle>
                <CardDescription>Simulate a fan message to see how the AI would respond</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Confidence Threshold: {confidenceThreshold}%</Label>
                  <p className="text-xs text-muted-foreground">
                    Messages above this threshold are auto-sent. Below = queued for review.
                  </p>
                  <Input
                    type="range"
                    min={30}
                    max={95}
                    value={confidenceThreshold}
                    onChange={e => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <Textarea
                  placeholder="Type a fan message to test..."
                  value={testFanMessage}
                  onChange={e => setTestFanMessage(e.target.value)}
                  rows={3}
                />
                <Button onClick={testReply} disabled={testingReply}>
                  {testingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {testingReply ? "Generating..." : "Test Reply"}
                </Button>
              </CardContent>
            </Card>

            {testResult && (
              <Card className={testResult.autoReply ? "border-success" : "border-warning"}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {testResult.autoReply ? (
                        <><Zap className="h-4 w-4 text-success" /> Would Auto-Reply</>
                      ) : (
                        <><AlertTriangle className="h-4 w-4 text-warning" /> Would Queue for Review</>
                      )}
                    </CardTitle>
                    <Badge variant={testResult.confidence >= confidenceThreshold ? "default" : "destructive"}>
                      {testResult.confidence}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm">{testResult.reply}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{testResult.reason}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Auto-Reply Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auto-Reply Rules</CardTitle>
                <CardDescription>Set trigger patterns for instant automated replies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {rules.map(rule => (
                  <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">Trigger: {rule.trigger}</p>
                      <p className="text-sm mt-0.5">{rule.response}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Messages Handled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-2xl font-bold">0%</p>
                  <p className="text-xs text-muted-foreground">Auto-Reply Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
                  <p className="text-2xl font-bold">0s</p>
                  <p className="text-xs text-muted-foreground">Avg Response Time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <UserCheck className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">0%</p>
                  <p className="text-xs text-muted-foreground">Approval Rate</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardContent className="py-12 text-center">
                <BrainCircuit className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium">No data yet</p>
                <p className="text-sm text-muted-foreground">Performance stats will appear once the AI Chatter handles messages</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
