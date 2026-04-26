"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pipette,
  Check,
  Hash,
  RotateCcw,
  Palette,
  Clock,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

/* ──────────────────────────────────────────────
   Color conversion utilities
   ────────────────────────────────────────────── */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(sanitized)) return null;
  return {
    r: parseInt(sanitized.substring(0, 2), 16),
    g: parseInt(sanitized.substring(2, 4), 16),
    b: parseInt(sanitized.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr:
        h = (gg - bb) / d + (gg < bb ? 6 : 0);
        break;
      case gg:
        h = (bb - rr) / d + 2;
        break;
      case bb:
        h = (rr - gg) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  const hh = h / 360;
  const ss = s / 100;
  const ll = l / 100;
  let r: number, g: number, b: number;

  if (ss === 0) {
    r = g = b = ll;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

/* ──────────────────────────────────────────────
   Default presets & constants
   ────────────────────────────────────────────── */

const PRESET_COLORS = [
  "#0A0A0F", "#1E1E2E", "#2D2D44", "#3B3B54",
  "#FF6B6B", "#F43F5E", "#EC4899", "#D946EF",
  "#A855F7", "#8B5CF6", "#6366F1", "#3B82F6",
  "#0EA5E9", "#06B6D4", "#14B8A6", "#10B981",
  "#22C55E", "#84CC16", "#EAB308", "#F59E0B",
  "#F97316", "#EF4444", "#7878EC", "#7C3AED",
  "#FFFFFF", "#F1F5F9", "#CBD5E1", "#64748B",
];

const RECENT_COLORS_KEY = "color-picker-recent";
const MAX_RECENT = 14;

function loadRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveRecentColors(colors: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

/* ──────────────────────────────────────────────
   Swatch Component
   ────────────────────────────────────────────── */

interface ColorSwatchProps {
  color: string;
  isActive?: boolean;
  onClick: (color: string) => void;
  size?: "sm" | "md";
  index?: number;
}

function ColorSwatch({
  color,
  isActive = false,
  onClick,
  size = "md",
  index = 0,
}: ColorSwatchProps) {
  const rgb = hexToRgb(color);
  const brightness = rgb
    ? (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    : 128;
  const checkColor = brightness > 128 ? "#000" : "#fff";

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.01,
      }}
      whileHover={{ scale: 1.18, zIndex: 10 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onClick(color)}
      className={cn(
        "relative rounded-md border-2 transition-shadow duration-fast ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
        size === "sm" ? "h-5 w-5" : "h-7 w-7",
        isActive
          ? "border-[var(--accent-primary)] shadow-[0_0_0_1px_var(--accent-primary)]"
          : "border-transparent hover:border-[var(--border-default)] hover:shadow-low"
      )}
      style={{ backgroundColor: color }}
      title={color}
    >
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check size={size === "sm" ? 10 : 12} color={checkColor} strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}

/* ──────────────────────────────────────────────
   Gradient Hue Slider
   ────────────────────────────────────────────── */

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

function HueSlider({ hue, onChange }: HueSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const handlePointer = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onChange(Math.round(x * 360));
    },
    [onChange]
  );

  return (
    <div
      ref={trackRef}
      className="relative h-4 w-full cursor-pointer rounded-full select-none touch-none"
      style={{
        background:
          "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
      }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handlePointer(e);
      }}
    >
      <motion.div
        className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
        }}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Saturation-Lightness Picker
   ────────────────────────────────────────────── */

interface SLPickerProps {
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (saturation: number, lightness: number) => void;
}

function SLPicker({ hue, saturation, lightness, onChange }: SLPickerProps) {
  const areaRef = React.useRef<HTMLDivElement>(null);

  const handlePointer = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = areaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const s = Math.round(x * 100);
      const l = Math.round((1 - y) * 100);
      onChange(s, l);
    },
    [onChange]
  );

  return (
    <div
      ref={areaRef}
      className="relative h-32 w-full cursor-pointer rounded-lg select-none touch-none overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
      }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handlePointer(e);
      }}
    >
      <motion.div
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${saturation}%`,
          top: `${100 - lightness}%`,
          backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        }}
        layout
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   ColorPicker Component
   ────────────────────────────────────────────── */

export interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  presets?: string[];
  showRecent?: boolean;
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  value = "#3B82F6",
  onChange,
  presets = PRESET_COLORS,
  showRecent = true,
  children,
  align = "center",
  sideOffset = 4,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(value);
  const [activeTab, setActiveTab] = React.useState<"picker" | "hex" | "rgb" | "hsl">("picker");
  const [recentColors, setRecentColors] = React.useState<string[]>(loadRecentColors);

  const currentValue = value !== undefined ? value : internalValue;

  /* derived HSL for the visual picker */
  const hsl = hexToHsl(currentValue) || { h: 210, s: 80, l: 50 };

  /* derived RGB for input display */
  const rgb = hexToRgb(currentValue) || { r: 59, g: 130, b: 246 };

  /* inputs state */
  const [hexInput, setHexInput] = React.useState(currentValue.replace("#", ""));
  const [rgbInput, setRgbInput] = React.useState({ r: rgb.r, g: rgb.g, b: rgb.b });
  const [hslInput, setHslInput] = React.useState({ h: hsl.h, s: hsl.s, l: hsl.l });

  React.useEffect(() => {
    setHexInput(currentValue.replace("#", ""));
    const r = hexToRgb(currentValue);
    if (r) {
      setRgbInput(r);
      setHslInput(rgbToHsl(r.r, r.g, r.b));
    }
  }, [currentValue]);

  const applyColor = React.useCallback(
    (newColor: string) => {
      const normalized = newColor.startsWith("#") ? newColor : `#${newColor}`;
      setInternalValue(normalized);
      onChange?.(normalized);
    },
    [onChange]
  );

  const commitColor = React.useCallback(
    (newColor: string) => {
      applyColor(newColor);
      if (showRecent) {
        setRecentColors((prev) => {
          const filtered = prev.filter((c) => c.toLowerCase() !== newColor.toLowerCase());
          const next = [newColor, ...filtered].slice(0, MAX_RECENT);
          saveRecentColors(next);
          return next;
        });
      }
    },
    [applyColor, showRecent]
  );

  const handleHueChange = (newHue: number) => {
    const newRgb = hslToRgb(newHue, hsl.s, hsl.l);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    applyColor(newHex);
  };

  const handleSLChange = (newSaturation: number, newLightness: number) => {
    const newRgb = hslToRgb(hsl.h, newSaturation, newLightness);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    applyColor(newHex);
  };

  const handleHexSubmit = () => {
    const withHash = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
    if (isValidHex(withHash)) {
      applyColor(withHash);
    } else {
      setHexInput(currentValue.replace("#", ""));
    }
  };

  const handleRgbSubmit = () => {
    const newHex = rgbToHex(rgbInput.r, rgbInput.g, rgbInput.b);
    applyColor(newHex);
  };

  const handleHslSubmit = () => {
    const newRgb = hslToRgb(hslInput.h, hslInput.s, hslInput.l);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    applyColor(newHex);
  };

  const handlePresetClick = (color: string) => {
    commitColor(color);
  };

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <button
            disabled={disabled}
            className={cn(
              "group inline-flex items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-all duration-fast ease-out",
              "hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-2)] hover:shadow-low",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <motion.span
              className="inline-block h-5 w-5 rounded-sm border border-[var(--border-subtle)] shadow-sm"
              style={{ backgroundColor: currentValue }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
            <span className="font-mono text-xs uppercase tracking-wide">
              {currentValue}
            </span>
            <Pipette
              size={14}
              className="text-[var(--text-tertiary)] transition-colors duration-fast group-hover:text-[var(--text-primary)]"
            />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={sideOffset}
        className="w-[280px] p-0 overflow-hidden"
        asChild
      >
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {/* Preview bar */}
          <div
            className="flex h-10 w-full items-center justify-between px-3"
            style={{ backgroundColor: currentValue }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color:
                  (rgb ? (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 : 128) > 128
                    ? "#000"
                    : "#fff",
              }}
            >
              {currentValue}
            </span>
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => commitColor(currentValue)}
                className="rounded p-1 transition-colors hover:bg-white/20"
                style={{
                  color:
                    (rgb ? (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 : 128) > 128
                      ? "#000"
                      : "#fff",
                }}
                title="Confirm color"
              >
                <Check size={14} />
              </motion.button>
            </div>
          </div>

          <div className="p-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="picker" className="text-xs px-1">
                  <Palette size={13} className="sm:mr-1" />
                  <span className="hidden sm:inline">Picker</span>
                </TabsTrigger>
                <TabsTrigger value="hex" className="text-xs px-1">
                  <Hash size={13} className="sm:mr-1" />
                  <span className="hidden sm:inline">Hex</span>
                </TabsTrigger>
                <TabsTrigger value="rgb" className="text-xs px-1">
                  RGB
                </TabsTrigger>
                <TabsTrigger value="hsl" className="text-xs px-1">
                  HSL
                </TabsTrigger>
              </TabsList>

              {/* Picker Tab */}
              <TabsContent value="picker" className="mt-3 space-y-3">
                <SLPicker
                  hue={hsl.h}
                  saturation={hsl.s}
                  lightness={hsl.l}
                  onChange={handleSLChange}
                />
                <HueSlider hue={hsl.h} onChange={handleHueChange} />

                {/* Quick presets row */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {presets.slice(0, 14).map((color, i) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      isActive={color.toLowerCase() === currentValue.toLowerCase()}
                      onClick={handlePresetClick}
                      size="sm"
                      index={i}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* Hex Tab */}
              <TabsContent value="hex" className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium text-[var(--text-tertiary)]">#</span>
                  <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
                      setHexInput(val);
                    }}
                    onBlur={handleHexSubmit}
                    onKeyDown={(e) => e.key === "Enter" && handleHexSubmit()}
                    className="flex-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-mono text-[var(--text-primary)] uppercase transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
                    maxLength={6}
                    placeholder="3B82F6"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHexSubmit}
                  className="w-full rounded-md bg-[var(--accent-primary)] px-3 py-2 text-sm font-medium text-[var(--text-inverse)] transition-all duration-fast hover:brightness-110"
                >
                  Apply
                </motion.button>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {presets.map((color, i) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      isActive={color.toLowerCase() === currentValue.toLowerCase()}
                      onClick={handlePresetClick}
                      size="sm"
                      index={i}
                    />
                  ))}
                </div>
              </TabsContent>

              {/* RGB Tab */}
              <TabsContent value="rgb" className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(["r", "g", "b"] as const).map((ch) => (
                    <div key={ch} className="space-y-1">
                      <label className="block text-center text-xs font-medium uppercase text-[var(--text-secondary)]">
                        {ch}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={rgbInput[ch]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                          setRgbInput((prev) => ({ ...prev, [ch]: val }));
                        }}
                        onBlur={handleRgbSubmit}
                        onKeyDown={(e) => e.key === "Enter" && handleRgbSubmit()}
                        className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-2 text-center text-sm font-mono text-[var(--text-primary)] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-xs font-mono text-[var(--text-tertiary)] text-center">
                  rgb({rgbInput.r}, {rgbInput.g}, {rgbInput.b})
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRgbSubmit}
                  className="w-full rounded-md bg-[var(--accent-primary)] px-3 py-2 text-sm font-medium text-[var(--text-inverse)] transition-all duration-fast hover:brightness-110"
                >
                  Apply
                </motion.button>
              </TabsContent>

              {/* HSL Tab */}
              <TabsContent value="hsl" className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-center text-xs font-medium uppercase text-[var(--text-secondary)]">
                      H
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={hslInput.h}
                      onChange={(e) =>
                        setHslInput((p) => ({
                          ...p,
                          h: Math.max(0, Math.min(360, Number(e.target.value) || 0)),
                        }))
                      }
                      onBlur={handleHslSubmit}
                      onKeyDown={(e) => e.key === "Enter" && handleHslSubmit()}
                      className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-2 text-center text-sm font-mono text-[var(--text-primary)] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-center text-xs font-medium uppercase text-[var(--text-secondary)]">
                      S%
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hslInput.s}
                      onChange={(e) =>
                        setHslInput((p) => ({
                          ...p,
                          s: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        }))
                      }
                      onBlur={handleHslSubmit}
                      onKeyDown={(e) => e.key === "Enter" && handleHslSubmit()}
                      className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-2 text-center text-sm font-mono text-[var(--text-primary)] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-center text-xs font-medium uppercase text-[var(--text-secondary)]">
                      L%
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={hslInput.l}
                      onChange={(e) =>
                        setHslInput((p) => ({
                          ...p,
                          l: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        }))
                      }
                      onBlur={handleHslSubmit}
                      onKeyDown={(e) => e.key === "Enter" && handleHslSubmit()}
                      className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-2 text-center text-sm font-mono text-[var(--text-primary)] transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
                    />
                  </div>
                </div>
                <div className="text-xs font-mono text-[var(--text-tertiary)] text-center">
                  hsl({hslInput.h}, {hslInput.s}%, {hslInput.l}%)
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHslSubmit}
                  className="w-full rounded-md bg-[var(--accent-primary)] px-3 py-2 text-sm font-medium text-[var(--text-inverse)] transition-all duration-fast hover:brightness-110"
                >
                  Apply
                </motion.button>
              </TabsContent>
            </Tabs>

            {/* Recent colors */}
            <AnimatePresence>
              {showRecent && recentColors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 border-t border-[var(--border-subtle)] pt-3"
                >
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                    <Clock size={12} />
                    Recent
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentColors.map((color, i) => (
                      <ColorSwatch
                        key={`${color}-${i}`}
                        color={color}
                        isActive={color.toLowerCase() === currentValue.toLowerCase()}
                        onClick={handlePresetClick}
                        size="sm"
                        index={i}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Presets section in picker tab */}
            {activeTab === "picker" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-3 border-t border-[var(--border-subtle)] pt-3"
              >
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <Palette size={12} />
                  Presets
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((color, i) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      isActive={color.toLowerCase() === currentValue.toLowerCase()}
                      onClick={handlePresetClick}
                      size="sm"
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

/* ──────────────────────────────────────────────
   Inline Color Picker (smaller, inline variant)
   ────────────────────────────────────────────── */

export interface InlineColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  presets?: string[];
  showRecent?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function InlineColorPicker({
  value = "#3B82F6",
  onChange,
  presets = PRESET_COLORS,
  showRecent = true,
  size = "md",
  className,
}: InlineColorPickerProps) {
  const [recentColors, setRecentColors] = React.useState<string[]>(loadRecentColors);

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  const handleColorSelect = (color: string) => {
    onChange?.(color);
    if (showRecent) {
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== color.toLowerCase());
        const next = [color, ...filtered].slice(0, MAX_RECENT);
        saveRecentColors(next);
        return next;
      });
    }
  };

  const allColors = showRecent
    ? [...recentColors.filter((c) => !presets.includes(c)), ...presets]
    : presets;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {allColors.map((color, i) => (
        <ColorSwatch
          key={`${color}-${i}`}
          color={color}
          isActive={color.toLowerCase() === value.toLowerCase()}
          onClick={handleColorSelect}
          size={size === "sm" ? "sm" : "md"}
          index={i}
        />
      ))}
    </div>
  );
}
