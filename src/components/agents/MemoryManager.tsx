import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Plus, Trash2, Edit2, Search, Bot, Share2, MessagesSquare, Sparkles } from "lucide-react";
import { useAgentMemories, type AgentMemory } from "@/hooks/useAgentMemories";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const AGENT_TABS = [
  { id: "coach_pbf", label: "Coach PBF", icon: Bot },
  { id: "tatum", label: "Tatum", icon: Share2 },
  { id: "izzy", label: "Marylin Monroe", icon: MessagesSquare },
];

const CATEGORIES = [
  { value: "user_preference", label: "Preference", color: "bg-blue-500/10 text-blue-500" },
  { value: "business_context", label: "Business", color: "bg-emerald-500/10 text-emerald-500" },
  { value: "action_history", label: "History", color: "bg-purple-500/10 text-purple-500" },
  { value: "relationship", label: "Relationship", color: "bg-orange-500/10 text-orange-500" },
  { value: "general", label: "General", color: "bg-muted text-muted-foreground" },
];

function getCategoryStyle(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.color || "bg-muted text-muted-foreground";
}
function getCategoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label || cat;
}

export function MemoryManager() {
  const [activeAgent, setActiveAgent] = useState("coach_pbf");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<AgentMemory | null>(null);
  const { memories, isLoading, addMemory, updateMemory, deleteMemory } = useAgentMemories(activeAgent);

  const filtered = memories.filter(m =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Agent Memory
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Memory</DialogTitle></DialogHeader>
              <AddMemoryForm agentType={activeAgent} onAdd={(data) => {
                addMemory.mutate(data);
                setAddOpen(false);
              }} />
            </DialogContent>
          </Dialog>
        </div>
        {/* Agent tabs */}
        <div className="flex gap-1 mt-2">
          {AGENT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAgent(tab.id)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activeAgent === tab.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search memories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-4 pb-4 space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No memories yet</p>
                <p className="text-xs text-muted-foreground mt-1">Memories are auto-extracted from conversations or can be added manually.</p>
              </div>
            ) : (
              filtered.map(memory => (
                <div key={memory.id} className="group border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", getCategoryStyle(memory.category))}>
                          {getCategoryLabel(memory.category)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          ★{memory.importance}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{memory.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(memory.updated_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Dialog open={editingMemory?.id === memory.id} onOpenChange={(open) => !open && setEditingMemory(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingMemory(memory)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Edit Memory</DialogTitle></DialogHeader>
                          <EditMemoryForm memory={memory} onSave={(data) => {
                            updateMemory.mutate({ id: memory.id, ...data });
                            setEditingMemory(null);
                          }} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMemory.mutate(memory.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AddMemoryForm({ agentType, onAdd }: { agentType: string; onAdd: (data: { agent_type: string; category: string; content: string; importance: number }) => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [importance, setImportance] = useState(5);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Memory</label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="e.g. Owner prefers weekly reports on Monday mornings..." rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium">Importance (1-10)</label>
        <Input type="number" min={1} max={10} value={importance} onChange={e => setImportance(Number(e.target.value))} />
      </div>
      <Button onClick={() => onAdd({ agent_type: agentType, category, content, importance })} disabled={!content.trim()} className="w-full">
        Save Memory
      </Button>
    </div>
  );
}

function EditMemoryForm({ memory, onSave }: { memory: AgentMemory; onSave: (data: { content: string; category: string; importance: number }) => void }) {
  const [content, setContent] = useState(memory.content);
  const [category, setCategory] = useState(memory.category);
  const [importance, setImportance] = useState(memory.importance);
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Memory</label>
        <Textarea value={content} onChange={e => setContent(e.target.value)} rows={3} />
      </div>
      <div>
        <label className="text-sm font-medium">Importance (1-10)</label>
        <Input type="number" min={1} max={10} value={importance} onChange={e => setImportance(Number(e.target.value))} />
      </div>
      <Button onClick={() => onSave({ content, category, importance })} disabled={!content.trim()} className="w-full">
        Update Memory
      </Button>
    </div>
  );
}
