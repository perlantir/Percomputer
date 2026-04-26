import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./Card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
    themes: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    className: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card className={args.className} style={{ width: "380px" }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content area of the card.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span>Footer content</span>
        <span>Action</span>
      </CardFooter>
    </Card>
  ),
};

export const WithImage: Story = {
  render: (args) => (
    <Card className={args.className} style={{ width: "380px" }}>
      <div className="h-40 bg-gradient-to-br from-purple-600 to-blue-600 rounded-t-lg" />
      <CardHeader>
        <CardTitle>Featured Card</CardTitle>
        <CardDescription>A card with an image header.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Cards can contain images, text, and interactive elements.</p>
      </CardContent>
      <CardFooter>
        <button className="text-sm text-blue-400 hover:underline">Learn more</button>
      </CardFooter>
    </Card>
  ),
};

export const Minimal: Story = {
  render: (args) => (
    <Card className={args.className} style={{ width: "300px" }}>
      <CardContent className="p-6">
        <p>Minimal card with only content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <Card className={args.className} style={{ width: "380px" }}>
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover over this card to see the effect.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card demonstrates interactive states and hover effects.</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        <button className="px-3 py-1 text-sm bg-primary text-white rounded">Save</button>
        <button className="px-3 py-1 text-sm border rounded">Cancel</button>
      </CardFooter>
    </Card>
  ),
};

export const Stacked: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className={args.className} style={{ width: "380px" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Card {i}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Stacked card item number {i}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
