"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  MousePointerClick,
  MessageSquareWarning,
  Inbox,
  Search,
  Box,
  FileQuestion,
  AlertTriangle,
  AlertCircle,
  WifiOff,
  FileX2,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  ChevronDown,
  Bell,
  Settings,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ToggleLeft,
  Type,
  TextCursor,
  Hash,
  Calendar,
  Percent,
  Star,
  Trash2,
  Download,
  Upload,
  Copy,
  ExternalLink,
  Check,
  Loader2,
  Plus,
  Minus,
  Sun,
  Moon,
  Palette,
  Layout,
  FormInput,
  Layers,
  Sparkles,
} from "lucide-react";

/* ── UI Components ── */
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { Slider } from "@/src/components/ui/slider";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/src/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/src/components/ui/tooltip";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ErrorState } from "@/src/components/ui/error-state";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { cn } from "@/src/lib/utils";

/* ═══════════════════════════════════════════════════════════
   Animation constants
   ═══════════════════════════════════════════════════════════ */
const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

/* ═══════════════════════════════════════════════════════════
   Section title component
   ═══════════════════════════════════════════════════════════ */
function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10">
        <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Demo card wrapper
   ═══════════════════════════════════════════════════════════ */
function DemoCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5",
        className
      )}
    >
      {title && (
        <h4 className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Prop badge for component props display
   ═══════════════════════════════════════════════════════════ */
function PropBadge({
  name,
  value,
}: {
  name: string;
  value: string | boolean | number;
}) {
  const displayValue = typeof value === "boolean" ? String(value) : value;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-surface-2)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
      <span className="text-[var(--accent-primary)]">{name}</span>
      <span className="text-[var(--text-tertiary)]">=</span>
      <span className="text-[var(--text-primary)]">{displayValue}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — Buttons
   ═══════════════════════════════════════════════════════════ */
function ButtonsTab() {
  const [clickCount, setClickCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const handleLoadingClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <motion.div {...fadeIn} className="space-y-5">
      <SectionTitle
        icon={MousePointerClick}
        title="Buttons"
        description="Interactive button variants, sizes, states, and behaviors."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <DemoCard title="Variants">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="warning">Warning</Button>
          </div>
        </DemoCard>

        <DemoCard title="Sizes">
          <div className="flex flex-wrap items-end gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DemoCard>

        <DemoCard title="States">
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
            <Button loading variant="secondary">
              Loading
            </Button>
          </div>
        </DemoCard>

        <DemoCard title="Interactive">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setClickCount((c) => c + 1)}
                variant="primary"
              >
                Clicked {clickCount} times
              </Button>
              <Button
                onClick={handleLoadingClick}
                loading={loading}
                variant="secondary"
              >
                {loading ? "Saving..." : "Trigger Loading"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <PropBadge name="onClick" value="callback" />
              <PropBadge name="loading" value={loading} />
            </div>
          </div>
        </DemoCard>

        <DemoCard title="With Icons">
          <div className="flex flex-wrap gap-3">
            <Button>
              <Plus className="h-4 w-4" />
              Create New
            </Button>
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="danger">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button variant="ghost">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </DemoCard>

        <DemoCard title="Full Width">
          <div className="space-y-2">
            <Button fullWidth>Full Width Primary</Button>
            <Button fullWidth variant="secondary">
              Full Width Secondary
            </Button>
          </div>
        </DemoCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — Badges
   ═══════════════════════════════════════════════════════════ */
function BadgesTab() {
  return (
    <motion.div {...fadeIn} className="space-y-5">
      <SectionTitle
        icon={Sparkles}
        title="Badges"
        description="Status indicators, labels, and counters in multiple variants."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <DemoCard title="Variants">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="accent">Accent</Badge>
          </div>
        </DemoCard>

        <DemoCard title="Sizes">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm">Small</Badge>
            <Badge size="md">Medium</Badge>
            <Badge size="lg">Large</Badge>
          </div>
        </DemoCard>

        <DemoCard title="In Context">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)]">
                Server Status
              </span>
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)]">
                API Rate Limit
              </span>
              <Badge variant="warning">
                <Zap className="h-3 w-3 mr-1" />
                85% Used
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)]">
                Deployment
              </span>
              <Badge variant="danger">
                <XCircle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)]">
                Build
              </span>
              <Badge variant="info">
                <Info className="h-3 w-3 mr-1" />
                #4,231
              </Badge>
            </div>
          </div>
        </DemoCard>

        <DemoCard title="Combining">
          <div className="flex flex-wrap gap-2">
            <Badge variant="success" size="sm">
              <Check className="h-3 w-3 mr-0.5" />
              Passed
            </Badge>
            <Badge variant="accent" size="sm">
              New
            </Badge>
            <Badge variant="warning" size="sm">
              Pending
            </Badge>
            <Badge variant="danger" size="sm">
              Critical
            </Badge>
            <Badge variant="info" size="sm">
              Beta
            </Badge>
          </div>
        </DemoCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — Cards
   ═══════════════════════════════════════════════════════════ */
function CardsTab() {
  return (
    <motion.div {...fadeIn} className="space-y-5">
      <SectionTitle
        icon={CreditCard}
        title="Cards"
        description="Content containers with multiple elevation and style variants."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <DemoCard title="Card Variants">
          <div className="space-y-3">
            <Card variant="default" className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Default Card
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Subtle border with hover glow effect.
              </p>
            </Card>
            <Card variant="ghost" className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Ghost Card
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Filled background with subtle hover.
              </p>
            </Card>
            <Card variant="elevated" className="p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Elevated Card
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Lifted shadow with hover lift effect.
              </p>
            </Card>
          </div>
        </DemoCard>

        <DemoCard title="Full Card Composition">
          <Card variant="default" className="max-w-sm">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>
                A descriptive subtitle that explains the card&apos;s purpose.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-secondary)]">
                Main content area where you can place any information,
                components, or data visualizations.
              </p>
            </CardContent>
            <CardFooter className="justify-between">
              <Button size="sm" variant="ghost">
                Cancel
              </Button>
              <Button size="sm">Confirm</Button>
            </CardFooter>
          </Card>
        </DemoCard>

        <DemoCard title="Card with Badge">
          <Card variant="default" className="max-w-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Workflow</CardTitle>
                <Badge variant="success">Active</Badge>
              </div>
              <CardDescription>
                Multi-agent orchestration pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
                Processing 23 tasks...
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="secondary" fullWidth>
                <ExternalLink className="h-4 w-4" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        </DemoCard>

        <DemoCard title="Stats Card">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Users", value: "12,450", change: "+12%" },
              { label: "Workflows", value: "1,238", change: "+5%" },
              { label: "Agents", value: "89", change: "+3" },
              { label: "Uptime", value: "99.9%", change: "Stable" },
            ].map((stat) => (
              <Card key={stat.label} variant="ghost" className="p-4">
                <p className="text-xs text-[var(--text-secondary)]">
                  {stat.label}
                </p>
                <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                  {stat.value}
                </p>
                <Badge size="sm" variant="success" className="mt-1">
                  {stat.change}
                </Badge>
              </Card>
            ))}
          </div>
        </DemoCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — Forms
   ═══════════════════════════════════════════════════════════ */
function FormsTab() {
  const [inputValue, setInputValue] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [sliderValue, setSliderValue] = React.useState([50]);
  const [isSwitchOn, setIsSwitchOn] = React.useState(true);
  const [selectValue, setSelectValue] = React.useState("");
  const [textareaValue, setTextareaValue] = React.useState("");

  return (
    <motion.div {...fadeIn} className="space-y-5">
      <SectionTitle
        icon={FormInput}
        title="Form Controls"
        description="Inputs, textareas, selects, sliders, and switches."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <DemoCard title="Text Input Variants">
          <div className="space-y-3">
            <Input
              label="Default Input"
              placeholder="Type something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              iconLeft={<Type className="h-4 w-4" />}
            />
            <Input
              label="Ghost Variant"
              variant="ghost"
              placeholder="Ghost styled input"
            />
            <Input
              label="With Error"
              placeholder="Invalid input"
              errorMessage="This field is required"
              iconLeft={<AlertCircle className="h-4 w-4" />}
            />
            <Input
              label="Helper Text"
              placeholder="With helper"
              helperText="Enter your full name as it appears on your ID"
            />
          </div>
        </DemoCard>

        <DemoCard title="Specialized Inputs">
          <div className="space-y-3">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value="password123"
              iconLeft={<Lock className="h-4 w-4" />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-[var(--text-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              iconLeft={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Search"
              type="search"
              placeholder="Search..."
              iconLeft={<Search className="h-4 w-4" />}
            />
            <Input label="Disabled" disabled placeholder="Cannot edit" />
          </div>
        </DemoCard>

        <DemoCard title="Select Dropdown">
          <Select value={selectValue} onValueChange={setSelectValue}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a model..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="claude-3">Claude 3 Opus</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
          {selectValue && (
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Selected: <span className="font-mono text-[var(--accent-primary)]">{selectValue}</span>
            </p>
          )}
        </DemoCard>

        <DemoCard title="Textarea">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Auto-growing textarea
            </label>
            <Textarea
              autoGrow
              maxRows={8}
              minRows={2}
              placeholder="Type multiple lines... the textarea will grow automatically."
              value={textareaValue}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextareaValue(e.target.value)}
            />
          </div>
        </DemoCard>

        <DemoCard title="Slider">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Temperature
              </label>
              <span className="font-mono text-sm text-[var(--accent-primary)]">
                {sliderValue[0] / 100}
              </span>
            </div>
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>
        </DemoCard>

        <DemoCard title="Switch / Toggle">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Enable Notifications
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Receive alerts for important events
                </p>
              </div>
              <Switch
                checked={isSwitchOn}
                onCheckedChange={setIsSwitchOn}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Dark Mode
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Use system theme
                </p>
              </div>
              <Switch disabled />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Auto-save
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Save drafts automatically
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <PropBadge name="checked" value={isSwitchOn} />
              <PropBadge name="disabled" value={false} />
            </div>
          </div>
        </DemoCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — Feedback
   ═══════════════════════════════════════════════════════════ */
function FeedbackTab() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogVariant, setDialogVariant] = React.useState<"info" | "danger">("info");

  const openDialog = (variant: "info" | "danger") => {
    setDialogVariant(variant);
    setDialogOpen(true);
  };

  return (
    <motion.div {...fadeIn} className="space-y-5">
      <SectionTitle
        icon={MessageSquareWarning}
        title="Feedback Components"
        description="Dialogs, tooltips, empty states, error states, and skeletons."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <DemoCard title="Dialog">
          <div className="flex flex-wrap gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="primary" onClick={() => openDialog("info")}>
                  Open Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {dialogVariant === "danger"
                      ? "Delete Confirmation"
                      : "Dialog Title"}
                  </DialogTitle>
                  <DialogDescription>
                    {dialogVariant === "danger"
                      ? "This action cannot be undone. The workflow and all associated data will be permanently removed."
                      : "This is a dialog description. It provides additional context about the action the user is about to take."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant={dialogVariant === "danger" ? "danger" : "primary"}
                  >
                    {dialogVariant === "danger" ? "Delete" : "Confirm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="danger"
              onClick={() => openDialog("danger")}
            >
              Delete Dialog
            </Button>
          </div>
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            Dialog includes spring animations, backdrop blur, and keyboard
            support (Escape to close).
          </p>
        </DemoCard>

        <DemoCard title="Tooltip">
          <TooltipProvider>
            <div className="flex flex-wrap gap-4 items-center justify-center py-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="secondary">
                    Hover Me
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tooltip on the right side</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="info">Info Badge</Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Tooltips work on any element</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </DemoCard>

        <DemoCard title="Empty States">
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)]">
              <EmptyState
                variant="search"
                title="No results"
                description="Try adjusting your search terms."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["default", "search", "no-data", "not-found"] as const).map(
                (v) => (
                  <Badge
                    key={v}
                    variant="default"
                    className="cursor-pointer"
                  >
                    {v}
                  </Badge>
                )
              )}
            </div>
          </div>
        </DemoCard>

        <DemoCard title="Error States">
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-[var(--border-subtle)]">
              <ErrorState
                variant="generic"
                retry={() => {}}
                retryLabel="Retry"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["generic", "network", "not-found", "permission"] as const).map(
                (v) => (
                  <Badge
                    key={v}
                    variant={v === "network" ? "danger" : "default"}
                    className="cursor-pointer"
                  >
                    {v}
                  </Badge>
                )
              )}
            </div>
          </div>
        </DemoCard>

        <DemoCard title="Skeleton Loading" className="md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-lg" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </DemoCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — Layout & Misc
   ═══════════════════════════════════════════════════════════ */
function LayoutTab() {
  return (
    <motion.div {...fadeIn} className="space-y-5">
      <SectionTitle
        icon={Layout}
        title="Layout & Misc"
        description="Tabs, accordion, separator, and other structural components."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <DemoCard title="Tabs">
          <Tabs defaultValue="account">
            <TabsList className="w-full">
              <TabsTrigger value="account" className="flex-1">
                <User className="h-3.5 w-3.5 mr-1.5" />
                Account
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1">
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1">
                <Bell className="h-3.5 w-3.5 mr-1.5" />
                Alerts
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="mt-3 rounded-md border border-[var(--border-subtle)] p-4">
              <p className="text-sm text-[var(--text-primary)]">
                Account settings content.
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Manage your profile, email, and display preferences.
              </p>
            </TabsContent>
            <TabsContent value="security" className="mt-3 rounded-md border border-[var(--border-subtle)] p-4">
              <p className="text-sm text-[var(--text-primary)]">
                Security settings content.
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Update password, enable 2FA, manage sessions.
              </p>
            </TabsContent>
            <TabsContent value="notifications" className="mt-3 rounded-md border border-[var(--border-subtle)] p-4">
              <p className="text-sm text-[var(--text-primary)]">
                Notification preferences.
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Choose which events trigger alerts and emails.
              </p>
            </TabsContent>
          </Tabs>
        </DemoCard>

        <DemoCard title="Accordion">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is the agent platform?</AccordionTrigger>
              <AccordionContent>
                A multi-model, multi-agent orchestration platform for building,
                running, and scaling autonomous AI workflows.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Supported LLM providers</AccordionTrigger>
              <AccordionContent>
                OpenAI GPT-4, Anthropic Claude, Google Gemini, and local models
                via Ollama. Custom providers can be added via the connector API.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Pricing & limits</AccordionTrigger>
              <AccordionContent>
                Free tier includes 100 workflow runs/month. Pro tier unlocks
                unlimited runs, custom agents, and priority inference.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DemoCard>

        <DemoCard title="Separator">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
              <span>Item A</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Item B</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Item C</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>Left content</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Right content</span>
            </div>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs text-[var(--text-secondary)]">
                Horizontal separators divide content vertically.
              </p>
              <Separator />
              <p className="text-xs text-[var(--text-secondary)]">
                They adapt to the container width and use theme colors.
              </p>
            </div>
          </div>
        </DemoCard>

        <DemoCard title="Component Quick Reference">
          <div className="space-y-2 text-xs">
            {[
              { name: "Button", props: "variant, size, loading, fullWidth, asChild", source: "src/components/ui/button.tsx" },
              { name: "Badge", props: "variant, size", source: "src/components/ui/badge.tsx" },
              { name: "Card", props: "variant (default/ghost/elevated)", source: "src/components/ui/card.tsx" },
              { name: "Input", props: "variant, label, helperText, errorMessage, iconLeft, iconRight", source: "src/components/ui/input.tsx" },
              { name: "Dialog", props: "Animated with spring + backdrop blur", source: "src/components/ui/dialog.tsx" },
              { name: "Tooltip", props: "side, align, arrow, delay presets", source: "src/components/ui/tooltip.tsx" },
              { name: "Tabs", props: "Animated fade-in content", source: "src/components/ui/tabs.tsx" },
              { name: "Switch", props: "Radix primitive wrapper", source: "src/components/ui/switch.tsx" },
              { name: "Slider", props: "Radix primitive wrapper", source: "src/components/ui/slider.tsx" },
              { name: "Skeleton", props: "Pulse animation loading placeholder", source: "src/components/ui/skeleton.tsx" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-start justify-between gap-2 rounded-md p-2 hover:bg-[var(--bg-surface-2)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-mono font-medium text-[var(--accent-primary)]">
                    {item.name}
                  </span>
                  <p className="truncate text-[var(--text-tertiary)]">
                    {item.props}
                  </p>
                </div>
                <span className="shrink-0 text-[var(--text-tertiary)]">
                  {item.source}
                </span>
              </div>
            ))}
          </div>
        </DemoCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Playground Content
   ═══════════════════════════════════════════════════════════ */
export function PlaygroundContent() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto max-w-6xl space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Playground
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Interactive testing environment for UI components. Toggle
                states, interact with controls, and preview all variants.
              </p>
            </div>
            <Badge variant="accent" size="sm" className="w-fit">
              <FlaskConical className="h-3 w-3 mr-1" />
              Dev Only
            </Badge>
          </div>

          <Separator />

          {/* Component Tabs */}
          <Tabs defaultValue="buttons" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-[var(--bg-surface-2)] p-1">
              <TabsTrigger value="buttons" className="gap-1.5 text-xs sm:text-sm">
                <MousePointerClick className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Buttons</span>
              </TabsTrigger>
              <TabsTrigger value="badges" className="gap-1.5 text-xs sm:text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Badges</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-1.5 text-xs sm:text-sm">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </TabsTrigger>
              <TabsTrigger value="forms" className="gap-1.5 text-xs sm:text-sm">
                <FormInput className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Forms</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-1.5 text-xs sm:text-sm">
                <MessageSquareWarning className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="layout" className="gap-1.5 text-xs sm:text-sm">
                <Layout className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Layout</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="buttons">
                <ButtonsTab />
              </TabsContent>
              <TabsContent value="badges">
                <BadgesTab />
              </TabsContent>
              <TabsContent value="cards">
                <CardsTab />
              </TabsContent>
              <TabsContent value="forms">
                <FormsTab />
              </TabsContent>
              <TabsContent value="feedback">
                <FeedbackTab />
              </TabsContent>
              <TabsContent value="layout">
                <LayoutTab />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
