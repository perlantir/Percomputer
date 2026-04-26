# Component Documentation

## Table of Contents

1. [UI Primitives](#ui-primitives)
2. [Layout Components](#layout-components)
3. [Workflow Components](#workflow-components)
4. [Console Components](#console-components)
5. [Composer Components](#composer-components)

---

## UI Primitives

UI primitives are built on [shadcn/ui](https://ui.shadcn.com) components, which wrap [Radix UI](https://radix-ui.com) primitives with Tailwind CSS styling. These components are unopinionated, accessible, and composable.

### Available Primitives

| Component | Source | Description | Usage |
|-----------|--------|-------------|-------|
| `Button` | shadcn/ui | Clickable action element | Forms, dialogs, actions |
| `Input` | shadcn/ui | Text input field | Search, forms, settings |
| `Textarea` | shadcn/ui | Multi-line text input | Chat composer, prompts |
| `Select` | shadcn/ui | Dropdown selection | Model picker, filters |
| `Dialog` | shadcn/ui | Modal overlay | Confirmations, forms |
| `Sheet` | shadcn/ui | Side panel overlay | Mobile nav, detail panels |
| `DropdownMenu` | shadcn/ui | Context menu | Actions menu, filters |
| `Tooltip` | shadcn/ui | Hover info popup | Icon buttons, abbreviations |
| `Badge` | shadcn/ui | Status indicator | Model tags, status |
| `Avatar` | shadcn/ui | User image placeholder | Profiles, messages |
| `Skeleton` | shadcn/ui | Loading placeholder | List loading states |
| `Tabs` | shadcn/ui | Tabbed content | Settings, workflows |
| `Accordion` | shadcn/ui | Collapsible sections | FAQ, settings groups |
| `Toast` | shadcn/ui | Notification banner | Success, error alerts |
| `Progress` | shadcn/ui | Progress indicator | Uploads, execution |
| `Slider` | shadcn/ui | Range input | Temperature, settings |
| `Switch` | shadcn/ui | Toggle control | Feature toggles |
| `Checkbox` | shadcn/ui | Multi-select option | Forms, filters |
| `RadioGroup` | shadcn/ui | Single-select option | Settings, preferences |
| `Separator` | shadcn/ui | Visual divider | Lists, sections |
| `ScrollArea` | shadcn/ui | Custom scrollbar | Chat, logs |
| `Command` | shadcn/ui | Command palette | Search, navigation |
| `Popover` | shadcn/ui | Floating content panel | Pickers, previews |
| `Collapsible` | shadcn/ui | Expand/collapse | Thread list, groups |
| `HoverCard` | shadcn/ui | Rich hover preview | User profiles, previews |
| `Label` | shadcn/ui | Form label | All form inputs |
| `Table` | shadcn/ui | Data table | Lists, analytics |

### Button Usage

```tsx
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>

// As link
<Button asChild>
  <a href="/settings">Settings</a>
</Button>
```

### Input Usage

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="grid w-full max-w-sm items-center gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input
    type="email"
    id="email"
    placeholder="Enter your email"
    disabled={isLoading}
  />
</div>
```

### Select Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select value={modelId} onValueChange={setModelId}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select model" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="gpt-4">GPT-4</SelectItem>
    <SelectItem value="claude-3-5-sonnet">Claude 3.5</SelectItem>
  </SelectContent>
</Select>
```

### Dialog Usage

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### Command Palette (Search)

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search threads, agents, workflows..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Recent Threads">
      {threads.map((thread) => (
        <CommandItem
          key={thread.id}
          onSelect={() => router.push(`/chat/${thread.id}`)}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>{thread.title}</span>
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

---

## Layout Components

### DashboardShell

The main application shell providing the sidebar, header, and content area.

```tsx
// components/layout/dashboard-shell.tsx
"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### Sidebar

Collapsible navigation sidebar with organization switcher and navigation links.

```tsx
// components/layout/sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Console", href: "/console", icon: Terminal },
  { name: "Agents", href: "/agents", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r bg-sidebar">
      <div className="p-4">
        <OrganizationSwitcher />
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
              className={cn("justify-start gap-2", {
                "bg-sidebar-accent text-sidebar-accent-foreground":
                  pathname.startsWith(item.href),
              })}
              asChild
            >
              <a href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </a>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <UserProfile />
      </div>
    </aside>
  );
}
```

### Header

Top navigation bar with breadcrumbs, search, and notifications.

```tsx
// components/layout/header.tsx
"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { SearchCommand } from "./search-command";
import { NotificationBell } from "./notification-bell";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <Breadcrumbs />
      <div className="flex items-center gap-4">
        <SearchCommand />
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
```

### Breadcrumbs

Dynamic breadcrumb navigation based on current route.

```tsx
// components/layout/breadcrumbs.tsx
"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const routeNames: Record<string, string> = {
  chat: "Chat",
  workflows: "Workflows",
  console: "Console",
  agents: "Agents",
  settings: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <a href="/" className="hover:text-foreground">
        Home
      </a>
      {segments.map((segment, index) => (
        <span key={segment} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span className={index === segments.length - 1 ? "text-foreground" : ""}>
            {routeNames[segment] || segment}
          </span>
        </span>
      ))}
    </nav>
  );
}
```

### ThemeToggle

Dark/light mode toggle with system preference detection.

```tsx
// components/layout/theme-toggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

---

## Workflow Components

### WorkflowBuilder

The main workflow builder component combining React Flow canvas with node palette and property panel.

```tsx
// components/workflow/workflow-builder.tsx
"use client";

import { ReactFlow, Background, Controls } from "@xyflow/react";
import { useWorkflowStore } from "@/lib/zustand/workflow-store";
import { NodePalette } from "./node-palette";
import { PropertyPanel } from "./property-panel";
import { ExecutionPanel } from "./execution-panel";
import { nodeTypes } from "./node-types";

export function WorkflowBuilder() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useWorkflowStore();

  return (
    <div className="flex h-full">
      <NodePalette />
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      <PropertyPanel />
      <ExecutionPanel />
    </div>
  );
}
```

### Node Types

Custom node types for the workflow builder.

```tsx
// components/workflow/node-types.tsx
import { PromptNode } from "./nodes/prompt-node";
import { ConditionNode } from "./nodes/condition-node";
import { InputNode } from "./nodes/input-node";
import { OutputNode } from "./nodes/output-node";
import { ToolNode } from "./nodes/tool-node";

export const nodeTypes = {
  prompt: PromptNode,
  condition: ConditionNode,
  input: InputNode,
  output: OutputNode,
  tool: ToolNode,
};
```

### PromptNode

```tsx
// components/workflow/nodes/prompt-node.tsx
"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PromptNodeData {
  label: string;
  prompt: string;
  modelId: string;
  temperature?: number;
}

export const PromptNode = memo(({ data, selected }: NodeProps<PromptNodeData>) => {
  return (
    <Card className={`w-64 ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{data.label}</span>
          <Badge variant="outline">{data.modelId}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground line-clamp-3">
          {data.prompt}
        </p>
        {data.temperature !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Temp: {data.temperature}
          </p>
        )}
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
});
```

### NodePalette

Draggable node palette for adding nodes to the canvas.

```tsx
// components/workflow/node-palette.tsx
"use client";

import { useDrag } from "react-dnd";
import { Card } from "@/components/ui/card";

const nodeTemplates = [
  { type: "input", label: "Input", description: "Receive user input" },
  { type: "prompt", label: "Prompt", description: "AI prompt node" },
  { type: "condition", label: "Condition", description: "Branch logic" },
  { type: "tool", label: "Tool", description: "Execute tool" },
  { type: "output", label: "Output", description: "Return result" },
];

export function NodePalette() {
  return (
    <div className="w-64 border-r bg-muted/50 p-4">
      <h3 className="mb-4 font-semibold">Nodes</h3>
      <div className="flex flex-col gap-2">
        {nodeTemplates.map((template) => (
          <DraggableNode key={template.type} template={template} />
        ))}
      </div>
    </div>
  );
}

function DraggableNode({ template }: { template: NodeTemplate }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "node",
    item: { type: template.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Card
      ref={drag}
      className={`cursor-grab p-3 ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="font-medium">{template.label}</p>
      <p className="text-xs text-muted-foreground">{template.description}</p>
    </Card>
  );
}
```

### PropertyPanel

Side panel for editing selected node properties.

```tsx
// components/workflow/property-panel.tsx
"use client";

import { useWorkflowStore } from "@/lib/zustand/workflow-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PropertyPanel() {
  const selectedNode = useWorkflowStore((s) => s.selectedNode);
  const updateNode = useWorkflowStore((s) => s.updateNode);

  if (!selectedNode) {
    return (
      <div className="w-72 border-l p-4">
        <p className="text-muted-foreground">Select a node to edit</p>
      </div>
    );
  }

  return (
    <div className="w-72 border-l p-4">
      <h3 className="mb-4 font-semibold">Properties</h3>
      <div className="flex flex-col gap-4">
        <div>
          <Label>Label</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) =>
              updateNode(selectedNode.id, {
                data: { ...selectedNode.data, label: e.target.value },
              })
            }
          />
        </div>
        {selectedNode.type === "prompt" && (
          <>
            <div>
              <Label>Prompt</Label>
              <Textarea
                value={selectedNode.data.prompt}
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    data: { ...selectedNode.data, prompt: e.target.value },
                  })
                }
                rows={4}
              />
            </div>
            <div>
              <Label>Model</Label>
              <Select
                value={selectedNode.data.modelId}
                onValueChange={(v) =>
                  updateNode(selectedNode.id, {
                    data: { ...selectedNode.data, modelId: v },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-5-sonnet">Claude 3.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## Console Components

### ConsolePanel

Main console monitoring panel with tabs for logs, metrics, and timeline.

```tsx
// components/console/console-panel.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogStream } from "./log-stream";
import { MetricsPanel } from "./metrics-panel";
import { TimelineView } from "./timeline-view";

export function ConsolePanel() {
  return (
    <Tabs defaultValue="logs" className="h-full">
      <TabsList>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>
      <TabsContent value="logs" className="h-[calc(100%-3rem)]">
        <LogStream />
      </TabsContent>
      <TabsContent value="metrics" className="h-[calc(100%-3rem)]">
        <MetricsPanel />
      </TabsContent>
      <TabsContent value="timeline" className="h-[calc(100%-3rem)]">
        <TimelineView />
      </TabsContent>
    </Tabs>
  );
}
```

### LogStream

Real-time log streaming component with filtering and search.

```tsx
// components/console/log-stream.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source: string;
}

export function LogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/sse/console");

    eventSource.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs((prev) => [...prev, log]);
    };

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-2">
        <Input
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="space-y-1 p-2 font-mono text-xs">
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-muted-foreground">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <Badge
                variant={
                  log.level === "error"
                    ? "destructive"
                    : log.level === "warn"
                    ? "secondary"
                    : "outline"
                }
                className="text-[10px]"
              >
                {log.level}
              </Badge>
              <span className="text-muted-foreground">[{log.source}]</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

### MetricsPanel

Metrics dashboard with charts for token usage, latency, and costs.

```tsx
// components/console/metrics-panel.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function MetricsPanel() {
  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    refetchInterval: 30000,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Tokens"
        value={metrics?.totalTokens ?? 0}
        unit="tokens"
      />
      <MetricCard
        title="Avg Latency"
        value={metrics?.avgLatency ?? 0}
        unit="ms"
      />
      <MetricCard
        title="Total Cost"
        value={metrics?.totalCost ?? 0}
        unit="USD"
        prefix="$"
      />
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Token Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics?.usageOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="tokens"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  unit,
  prefix = "",
}: {
  title: string;
  value: number;
  unit: string;
  prefix?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </CardContent>
    </Card>
  );
}
```

---

## Composer Components

### ChatComposer

The main message input component with model selection, tool toggles, and send button.

```tsx
// components/chat/composer.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useChatStore } from "@/lib/zustand/chat-store";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Wrench } from "lucide-react";
import { ModelSelector } from "./model-selector";
import { ToolToggles } from "./tool-toggles";
import { cn } from "@/lib/utils";

export function Composer() {
  const [text, setText] = useState("");
  const [showTools, setShowTools] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedModel = useChatStore((s) => s.selectedModelId);
  const selectedTools = useChatStore((s) => s.selectedTools);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || !selectedModel) return;

    sendMessage({
      content: text,
      modelId: selectedModel,
      tools: selectedTools,
    });

    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, selectedModel, selectedTools, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        {/* Tool bar */}
        <div className="mb-2 flex items-center gap-2">
          <ModelSelector />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTools(!showTools)}
          >
            <Wrench className="mr-1 h-4 w-4" />
            Tools
            {selectedTools.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTools.length}
              </Badge>
            )}
          </Button>
          <Button variant="ghost" size="sm">
            <Paperclip className="mr-1 h-4 w-4" />
            Attach
          </Button>
        </div>

        {/* Tool toggles panel */}
        {showTools && <ToolToggles />}

        {/* Input area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[80px] resize-none pr-12"
            rows={1}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2"
            onClick={handleSubmit}
            disabled={!text.trim() || !selectedModel}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{text.length} characters</span>
        </div>
      </div>
    </div>
  );
}
```

### ModelSelector

Dropdown for selecting the active AI model.

```tsx
// components/chat/model-selector.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "@/lib/zustand/chat-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, DollarSign } from "lucide-react";

const providerIcons: Record<string, string> = {
  openai: "bg-ai-openai",
  anthropic: "bg-ai-anthropic",
  google: "bg-ai-google",
  ollama: "bg-ai-ollama",
};

export function ModelSelector() {
  const selectedModel = useChatStore((s) => s.selectedModelId);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);

  const { data: models } = useQuery({
    queryKey: ["models"],
    queryFn: fetchModels,
  });

  return (
    <Select value={selectedModel} onValueChange={setSelectedModel}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {models?.map((model) => (
          <SelectItem key={model.id} value={model.modelId}>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  providerIcons[model.provider] || "bg-primary"
                }`}
              />
              <span className="flex-1">{model.name}</span>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[10px]">
                  <Zap className="mr-1 h-3 w-3" />
                  {model.qualityScore}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="mr-1 h-3 w-3" />
                  {model.avgLatency}ms
                </Badge>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### ToolToggles

Toggle switches for enabling tools in the current conversation.

```tsx
// components/chat/tool-toggles.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "@/lib/zustand/chat-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function ToolToggles() {
  const selectedTools = useChatStore((s) => s.selectedTools);
  const toggleTool = useChatStore((s) => s.toggleTool);

  const { data: tools } = useQuery({
    queryKey: ["tools"],
    queryFn: fetchTools,
  });

  return (
    <Card className="mb-2 p-3">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {tools?.map((tool) => (
          <div key={tool.id} className="flex items-center gap-2">
            <Switch
              id={tool.id}
              checked={selectedTools.includes(tool.id)}
              onCheckedChange={() => toggleTool(tool.id)}
            />
            <div className="flex flex-col">
              <Label htmlFor={tool.id} className="text-sm">
                {tool.name}
              </Label>
              <span className="text-xs text-muted-foreground">
                {tool.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### MessageBubble

Individual message display component with support for different message types.

```tsx
// components/chat/message-bubble.tsx
"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { MessageActions } from "./message-actions";
import { MarkdownRenderer } from "./markdown-renderer";

interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isLast,
}: MessageBubbleProps) {
  const isUser = message.role === "USER";
  const isAssistant = message.role === "ASSISTANT";

  return (
    <div
      className={cn("flex gap-3 py-4", {
        "flex-row-reverse": isUser,
      })}
    >
      <Avatar className="h-8 w-8">
        {isUser ? (
          <>
            <AvatarImage src="/user-avatar.png" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={`/models/${message.modelId}.png`} />
            <AvatarFallback>
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className={cn("flex max-w-[80%] flex-col gap-1", {
        "items-end": isUser,
      })}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {isUser ? "You" : message.modelId || "Assistant"}
          </span>
          {message.modelId && (
            <Badge variant="outline" className="text-[10px]">
              {message.modelId}
            </Badge>
          )}
        </div>

        <Card
          className={cn("p-3", {
            "bg-primary text-primary-foreground": isUser,
            "bg-muted": !isUser,
          })}
        >
          <MarkdownRenderer content={message.content} />
        </Card>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1">
            {message.toolCalls.map((toolCall) => (
              <ToolCallCard key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {isLast && isAssistant && <MessageActions message={message} />}
      </div>
    </div>
  );
});
```

### MarkdownRenderer

Safe markdown rendering with syntax highlighting for code blocks.

```tsx
// components/chat/markdown-renderer.tsx
"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        a({ children, href, ...props }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
              {...props}
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### MessageActions

Action bar for assistant messages (copy, regenerate, thumbs up/down).

```tsx
// components/chat/message-actions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";

interface MessageActionsProps {
  message: Message;
}

export function MessageActions({ message }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    // Trigger message regeneration
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleCopy}
      >
        <Copy className={cn("h-4 w-4", copied && "text-green-500")} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleRegenerate}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", feedback === "up" && "text-green-500")}
        onClick={() => setFeedback("up")}
      >
        <ThumbsUp className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn("h-7 w-7", feedback === "down" && "text-red-500")}
        onClick={() => setFeedback("down")}
      >
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

### TypingIndicator

Animated typing indicator shown while the assistant is generating a response.

```tsx
// components/chat/typing-indicator.tsx
"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
```

---

## Component Index

### Quick Reference

| Component | Path | Type | Description |
|-----------|------|------|-------------|
| Button | `components/ui/button.tsx` | Primitive | Action button with variants |
| Input | `components/ui/input.tsx` | Primitive | Text input field |
| Textarea | `components/ui/textarea.tsx` | Primitive | Multi-line input |
| Select | `components/ui/select.tsx` | Primitive | Dropdown selection |
| Dialog | `components/ui/dialog.tsx` | Primitive | Modal overlay |
| Badge | `components/ui/badge.tsx` | Primitive | Status indicator |
| Avatar | `components/ui/avatar.tsx` | Primitive | User image |
| Skeleton | `components/ui/skeleton.tsx` | Primitive | Loading placeholder |
| Toast | `components/ui/toast.tsx` | Primitive | Notification |
| DashboardShell | `components/layout/dashboard-shell.tsx` | Layout | Main app shell |
| Sidebar | `components/layout/sidebar.tsx` | Layout | Navigation sidebar |
| Header | `components/layout/header.tsx` | Layout | Top bar |
| Breadcrumbs | `components/layout/breadcrumbs.tsx` | Layout | Route breadcrumbs |
| ThemeToggle | `components/layout/theme-toggle.tsx` | Layout | Dark/light toggle |
| ChatInterface | `components/chat/chat-interface.tsx` | Chat | Main chat UI |
| Composer | `components/chat/composer.tsx` | Chat | Message input |
| ModelSelector | `components/chat/model-selector.tsx` | Chat | Model dropdown |
| ToolToggles | `components/chat/tool-toggles.tsx` | Chat | Tool switches |
| MessageBubble | `components/chat/message-bubble.tsx` | Chat | Message display |
| MessageList | `components/chat/message-list.tsx` | Chat | Message list |
| MarkdownRenderer | `components/chat/markdown-renderer.tsx` | Chat | Markdown display |
| MessageActions | `components/chat/message-actions.tsx` | Chat | Message actions |
| TypingIndicator | `components/chat/typing-indicator.tsx` | Chat | Typing animation |
| WorkflowBuilder | `components/workflow/workflow-builder.tsx` | Workflow | Builder canvas |
| NodePalette | `components/workflow/node-palette.tsx` | Workflow | Node drag palette |
| PropertyPanel | `components/workflow/property-panel.tsx` | Workflow | Node editor |
| ExecutionPanel | `components/workflow/execution-panel.tsx` | Workflow | Execution monitor |
| PromptNode | `components/workflow/nodes/prompt-node.tsx` | Workflow | AI prompt node |
| ConditionNode | `components/workflow/nodes/condition-node.tsx` | Workflow | Branch node |
| ConsolePanel | `components/console/console-panel.tsx` | Console | Main console |
| LogStream | `components/console/log-stream.tsx` | Console | Live logs |
| MetricsPanel | `components/console/metrics-panel.tsx` | Console | Metrics dashboard |
| TimelineView | `components/console/timeline-view.tsx` | Console | Execution timeline |
