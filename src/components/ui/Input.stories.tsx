import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
    themes: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "search", "url", "tel"],
      description: "HTML input type",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disable the input",
    },
    required: {
      control: "boolean",
      description: "Make the input required",
    },
    value: {
      control: "text",
      description: "Input value",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
    onChange: { action: "changed" },
    onFocus: { action: "focused" },
    onBlur: { action: "blurred" },
  },
  args: {
    type: "text",
    placeholder: "Enter text...",
    disabled: false,
    required: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
};

export const WithValue: Story = {
  args: {
    value: "Pre-filled value",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
    value: "secret123",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "user@example.com",
  },
};

export const Number: Story = {
  args: {
    type: "number",
    placeholder: "42",
  },
};

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
    value: "Cannot edit this",
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2 w-72">
      <label htmlFor="story-input" className="text-sm font-medium">
        Email Address
      </label>
      <Input id="story-input" {...args} type="email" placeholder="name@company.com" />
      <p className="text-xs text-muted-foreground">We will never share your email.</p>
    </div>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <div className="flex flex-col gap-1 w-72">
      <Input {...args} placeholder="Username" className="border-red-500 focus-visible:ring-red-500" />
      <p className="text-xs text-red-500">Username is already taken.</p>
    </div>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search input" />
      <Input type="url" placeholder="URL input" />
      <Input type="tel" placeholder="Telephone input" />
    </div>
  ),
};
