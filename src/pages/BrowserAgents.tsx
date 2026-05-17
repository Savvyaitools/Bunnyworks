import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Play, Plus, Trash2, ExternalLink, Pencil, X, Workflow as WorkflowIcon, History } from "lucide-react";
import {
  useBrowserAgents,
  useBrowserWorkflows,
  useBrowserAgentRuns,
  launchBrowserAgent,
  cancelBrowserAgentRun,
  type BrowserAgent,
  type BrowserWorkflow,
  type WorkflowStep,
  type BrowserAgentRun,
} from "@/hooks/useBrowserAgents";
import { toast } from "sonner";
import { format } from "date-fns";

export default function BrowserAgents() {
  const [activeRun, setActiveRun] = useState<BrowserAgentRun | null>(null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" /> AI Browser Agents
          </h1>
          <p className="text-muted-foreground mt-1">
            Train AI agents and let them run browser workflows — social media, lead scraping, anything a human VA can do.
          </p>
        </div>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents"><Bot className="h-4 w-4 mr-2" />Agents</TabsTrigger>
          <TabsTrigger value="workflows"><WorkflowIcon className="h-4 w-4 mr-2" />Workflows</TabsTrigger>
          <TabsTrigger value="runs"><History className="h-4 w-4 mr-2" />Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="agents"><AgentsTab onRunStarted={setActiveRun} /></TabsContent>
        <TabsContent value="workflows"><WorkflowsTab onRunStarted={setActiveRun} /></TabsContent>
        <TabsContent value="runs"><RunsTab onOpenRun={setActiveRun} /></TabsContent>
      </Tabs>

      {activeRun && <RunViewerDialog run={activeRun} onClose={() => setActiveRun(null)} />}
    </div>
  );
}

/* ---------- Agents ---------- */

function AgentsTab({ onRunStarted }: { onRunStarted: (r: BrowserAgentRun) => void }) {
  const { agents, createAgent, updateAgent, deleteAgent } = useBrowserAgents();
  const [editing, setEditing] = useState<Partial<BrowserAgent> | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ name: "", system_prompt: "" })}>
          <Plus className="h-4 w-4 mr-2" />New Agent
        </Button>
      </div>

      {agents.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {agents.data?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No agents yet. Create one to define an AI persona and system prompt.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.data?.map((a) => (
          <Card key={a.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="truncate">{a.name}</span>
                <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
              </CardTitle>
              {a.description && <p className="text-sm text-muted-foreground line-clamp-2">{a.description}</p>}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground line-clamp-3 font-mono bg-muted/40 p-2 rounded">
                {a.system_prompt || "(no prompt)"}
              </p>
              <div className="flex gap-2 mt-auto">
                <QuickLaunchButton agentId={a.id} onStarted={onRunStarted} />
                <Button variant="ghost" size="icon" onClick={() => setEditing(a)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm(`Delete agent "${a.name}"?`)) deleteAgent.mutate(a.id);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <AgentEditor
          value={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            if (editing.id) await updateAgent.mutateAsync({ id: editing.id, ...v });
            else await createAgent.mutateAsync(v);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function AgentEditor({
  value,
  onClose,
  onSubmit,
}: {
  value: Partial<BrowserAgent>;
  onClose: () => void;
  onSubmit: (v: Partial<BrowserAgent>) => Promise<void>;
}) {
  const [form, setForm] = useState(value);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{value.id ? "Edit Agent" : "New Agent"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lead Scout" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Finds and scrapes lead info from social profiles" />
          </div>
          <div>
            <Label>Persona</Label>
            <Input value={form.persona ?? ""} onChange={(e) => setForm({ ...form, persona: e.target.value })} placeholder="e.g. Friendly junior researcher" />
          </div>
          <div>
            <Label>System Prompt</Label>
            <Textarea
              rows={8}
              value={form.system_prompt ?? ""}
              onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              placeholder="You are a careful research agent. Always extract data accurately and avoid clicking on ads…"
            />
          </div>
          <div>
            <Label>Default Start URL</Label>
            <Input value={form.default_start_url ?? ""} onChange={(e) => setForm({ ...form, default_start_url: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.name} onClick={() => onSubmit(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Workflows ---------- */

function WorkflowsTab({ onRunStarted }: { onRunStarted: (r: BrowserAgentRun) => void }) {
  const { workflows, createWorkflow, updateWorkflow, deleteWorkflow } = useBrowserWorkflows();
  const { agents } = useBrowserAgents();
  const [editing, setEditing] = useState<Partial<BrowserWorkflow> | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing({ name: "", steps: [] })}>
          <Plus className="h-4 w-4 mr-2" />New Workflow
        </Button>
      </div>

      {workflows.data?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No workflows yet. A workflow is a sequence of natural-language steps the agent will run.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {workflows.data?.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="truncate">{w.name}</span>
                <Badge variant="outline">{w.steps?.length ?? 0} steps</Badge>
              </CardTitle>
              {w.description && <p className="text-sm text-muted-foreground">{w.description}</p>}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 max-h-40 overflow-auto">
                {w.steps?.slice(0, 5).map((s, i) => (
                  <div key={i} className="text-xs flex gap-2">
                    <Badge variant="secondary" className="shrink-0">{s.type}</Badge>
                    <span className="text-muted-foreground line-clamp-1">{s.value}</span>
                  </div>
                ))}
                {(w.steps?.length ?? 0) > 5 && <p className="text-xs text-muted-foreground">+{w.steps.length - 5} more…</p>}
              </div>
              <div className="flex gap-2">
                <QuickLaunchButton workflowId={w.id} onStarted={onRunStarted} />
                <Button variant="ghost" size="icon" onClick={() => setEditing(w)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm(`Delete workflow "${w.name}"?`)) deleteWorkflow.mutate(w.id);
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <WorkflowEditor
          value={editing}
          agents={agents.data ?? []}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            if (editing.id) await updateWorkflow.mutateAsync({ id: editing.id, ...v });
            else await createWorkflow.mutateAsync(v);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function WorkflowEditor({
  value,
  agents,
  onClose,
  onSubmit,
}: {
  value: Partial<BrowserWorkflow>;
  agents: BrowserAgent[];
  onClose: () => void;
  onSubmit: (v: Partial<BrowserWorkflow>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<BrowserWorkflow>>({
    name: "", steps: [], ...value,
  });
  const steps = (form.steps ?? []) as WorkflowStep[];

  const updateStep = (i: number, patch: Partial<WorkflowStep>) => {
    const next = [...steps];
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, steps: next });
  };
  const removeStep = (i: number) => setForm({ ...form, steps: steps.filter((_, idx) => idx !== i) });
  const addStep = (type: WorkflowStep["type"]) => setForm({ ...form, steps: [...steps, { type, value: "" }] });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{value.id ? "Edit Workflow" : "New Workflow"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Linked Agent (optional)</Label>
              <Select value={form.agent_id ?? "none"} onValueChange={(v) => setForm({ ...form, agent_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Start URL</Label>
            <Input value={form.start_url ?? ""} onChange={(e) => setForm({ ...form, start_url: e.target.value })} placeholder="https://…" />
          </div>

          <div>
            <Label>Steps</Label>
            <div className="space-y-2 mt-2">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Select value={s.type} onValueChange={(v) => updateStep(i, { type: v as WorkflowStep["type"] })}>
                    <SelectTrigger className="w-28 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goto">goto</SelectItem>
                      <SelectItem value="act">act</SelectItem>
                      <SelectItem value="extract">extract</SelectItem>
                      <SelectItem value="wait">wait</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    rows={2}
                    className="flex-1"
                    value={s.value}
                    onChange={(e) => updateStep(i, { value: e.target.value })}
                    placeholder={
                      s.type === "goto" ? "https://…" :
                      s.type === "act" ? "Click the 'Follow' button" :
                      s.type === "extract" ? "Extract the 20 most recent post titles as an array of strings" :
                      "Milliseconds to wait (in value)"
                    }
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeStep(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => addStep("goto")}>+ goto</Button>
              <Button size="sm" variant="outline" onClick={() => addStep("act")}>+ act</Button>
              <Button size="sm" variant="outline" onClick={() => addStep("extract")}>+ extract</Button>
              <Button size="sm" variant="outline" onClick={() => addStep("wait")}>+ wait</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.name} onClick={() => onSubmit(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Quick Launch ---------- */

function QuickLaunchButton({
  agentId,
  workflowId,
  onStarted,
}: {
  agentId?: string;
  workflowId?: string;
  onStarted: (r: BrowserAgentRun) => void;
}) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState("");
  const [busy, setBusy] = useState(false);

  const launch = async () => {
    setBusy(true);
    try {
      const { runId } = await launchBrowserAgent({ agentId, workflowId, task: task || undefined });
      toast.success("Run started");
      setOpen(false);
      setTask("");
      onStarted({ id: runId, status: "pending" } as BrowserAgentRun);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Play className="h-3 w-3 mr-1" />Run</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Launch run</DialogTitle></DialogHeader>
        {workflowId ? (
          <p className="text-sm text-muted-foreground">This will execute the saved workflow steps in a Browserbase session.</p>
        ) : (
          <div className="space-y-2">
            <Label>Task (natural language)</Label>
            <Textarea
              rows={4}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Go to twitter.com/elonmusk and extract the 20 most recent tweets"
            />
            <p className="text-xs text-muted-foreground">Leave blank to use the agent's default behavior.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={launch} disabled={busy}>{busy ? "Starting…" : "Launch"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Runs ---------- */

function RunsTab({ onOpenRun }: { onOpenRun: (r: BrowserAgentRun) => void }) {
  const { runs } = useBrowserAgentRuns();
  const { agents } = useBrowserAgents();
  const { workflows } = useBrowserWorkflows();

  const agentName = (id: string | null) => agents.data?.find((a) => a.id === id)?.name;
  const workflowName = (id: string | null) => workflows.data?.find((w) => w.id === id)?.name;

  return (
    <div className="space-y-2">
      {runs.data?.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No runs yet.</CardContent></Card>
      )}
      {runs.data?.map((r) => (
        <Card key={r.id} className="cursor-pointer hover:bg-accent/50 transition" onClick={() => onOpenRun(r)}>
          <CardContent className="py-3 flex items-center gap-4">
            <StatusBadge status={r.status} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {agentName(r.agent_id) || workflowName(r.workflow_id) || r.task || "Ad-hoc run"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(r.created_at), "MMM d, HH:mm:ss")}
                {r.completed_at && ` · finished ${format(new Date(r.completed_at), "HH:mm:ss")}`}
              </p>
            </div>
            {r.live_view_url && (
              <Button size="sm" variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                <a href={r.live_view_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: BrowserAgentRun["status"] }) {
  const variant: Record<typeof status, "default" | "destructive" | "secondary" | "outline"> = {
    pending: "secondary",
    running: "default",
    completed: "outline",
    failed: "destructive",
    cancelled: "secondary",
  };
  return <Badge variant={variant[status]}>{status}</Badge>;
}

/* ---------- Run viewer ---------- */

function RunViewerDialog({ run, onClose }: { run: BrowserAgentRun; onClose: () => void }) {
  const { runs } = useBrowserAgentRuns();
  const live = useMemo(() => runs.data?.find((r) => r.id === run.id) ?? run, [runs.data, run]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Run <StatusBadge status={live.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="col-span-2 bg-muted rounded overflow-hidden">
            {live.live_view_url ? (
              <iframe src={live.live_view_url} className="w-full h-full" allow="clipboard-read; clipboard-write" />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                {live.status === "pending" ? "Starting browser session…" : "No live viewer available."}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex gap-2">
              {(live.status === "pending" || live.status === "running") && (
                <Button size="sm" variant="destructive" onClick={async () => {
                  await cancelBrowserAgentRun(live.id);
                  toast.success("Cancelled");
                }}>Cancel</Button>
              )}
              {live.live_view_url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={live.live_view_url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />Open
                  </a>
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-auto bg-muted/40 rounded p-2 text-xs font-mono space-y-1">
              {live.logs?.length ? live.logs.map((l, i) => (
                <div key={i} className="break-all">
                  <span className="text-muted-foreground">[{l.ts?.slice(11, 19)}]</span>{" "}
                  <span className={l.level === "error" ? "text-destructive" : ""}>{String(l.msg ?? JSON.stringify(l))}</span>
                </div>
              )) : <p className="text-muted-foreground">No logs yet.</p>}
              {live.error_message && (
                <div className="text-destructive mt-2">Error: {live.error_message}</div>
              )}
            </div>
            {live.result != null && (
              <details className="bg-muted/40 rounded p-2 text-xs">
                <summary className="cursor-pointer">Result</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">{JSON.stringify(live.result, null, 2)}</pre>
              </details>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}