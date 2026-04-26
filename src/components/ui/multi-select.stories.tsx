import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { MultiSelect, type MultiSelectOption } from "./multi-select";

/* ── Demo data ── */
const FRAMEWORKS: MultiSelectOption[] = [
  { value: "next", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "nuxt", label: "Nuxt" },
  { value: "solid", label: "SolidJS" },
  { value: "astro", label: "Astro" },
  { value: "remix", label: "Remix" },
  { value: "gatsby", label: "Gatsby", disabled: true },
];

const MODELS: MultiSelectOption[] = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "claude-3-5", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gemini-1-5", label: "Gemini 1.5 Pro" },
  { value: "llama-3", label: "Llama 3" },
  { value: "mistral", label: "Mistral Large" },
  { value: "command-r", label: "Command R+" },
];

/* ── Wrapper hook for controlled stories ── */
function ControlledMultiSelect(
  props: Omit<React.ComponentProps<typeof MultiSelect>, "value" | "onChange">
) {
  const [value, setValue] = useState<string[]>([]);
  return <MultiSelect {...props} value={value} onChange={setValue} />;
}

const meta: Meta<typeof MultiSelect> = {
  title: "UI/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
    themes: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    options: { control: "object" },
    placeholder: { control: "text" },
    searchPlaceholder: { control: "text" },
    label: { control: "text" },
    disabled: { control: "boolean" },
    maxCount: { control: "number" },
    searchable: { control: "boolean" },
    clearable: { control: "boolean" },
    selectAll: { control: "boolean" },
    badgeVariant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "info", "accent"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Stories ── */

export const Default: Story = {
  render: () => <ControlledMultiSelect options={FRAMEWORKS} />,
};

export const WithLabel: Story = {
  render: () => (
    <ControlledMultiSelect
      options={FRAMEWORKS}
      label="Frameworks"
      placeholder="Pick frameworks…"
    />
  ),
};

export const WithDefaultValues: Story = {
  render: () => (
    <ControlledMultiSelect
      options={FRAMEWORKS}
      defaultValue={["next", "react", "vue"]}
    />
  ),
};

export const NoSearch: Story = {
  render: () => (
    <ControlledMultiSelect options={FRAMEWORKS} searchable={false} />
  ),
};

export const NoClear: Story = {
  render: () => (
    <ControlledMultiSelect options={FRAMEWORKS} clearable={false} defaultValue={["react", "vue"]} />
  ),
};

export const NoSelectAll: Story = {
  render: () => (
    <ControlledMultiSelect options={FRAMEWORKS} selectAll={false} />
  ),
};

export const Disabled: Story = {
  render: () => (
    <ControlledMultiSelect
      options={FRAMEWORKS}
      disabled
      defaultValue={["next", "react"]}
    />
  ),
};

export const LowMaxCount: Story = {
  render: () => (
    <ControlledMultiSelect
      options={FRAMEWORKS}
      defaultValue={["next", "react", "vue", "svelte", "angular"]}
      maxCount={2}
    />
  ),
};

export const AccentBadges: Story = {
  render: () => (
    <ControlledMultiSelect
      options={MODELS}
      label="AI Models"
      badgeVariant="accent"
      defaultValue={["gpt-4o", "claude-3-5"]}
    />
  ),
};

export const SuccessBadges: Story = {
  render: () => (
    <ControlledMultiSelect
      options={FRAMEWORKS}
      badgeVariant="success"
      defaultValue={["next", "astro"]}
    />
  ),
};

export const FilterModels: Story = {
  render: () => (
    <ControlledMultiSelect
      options={MODELS}
      label="Select Models"
      placeholder="Choose AI models…"
      searchPlaceholder="Search models…"
    />
  ),
};

export const CustomSuffix: Story = {
  render: () => (
    <ControlledMultiSelect
      options={MODELS}
      label="Models with Ratings"
      renderItemSuffix={(option) => (
        <span className="text-[10px] tabular-nums text-[var(--text-tertiary)] opacity-60">
          {option.value}
        </span>
      )}
    />
  ),
};

export const NarrowContainer: Story = {
  render: () => (
    <div className="w-[240px]">
      <ControlledMultiSelect
        options={FRAMEWORKS}
        label="Narrow"
        maxCount={1}
      />
    </div>
  ),
};
