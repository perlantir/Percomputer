import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog";

describe("Dialog", () => {
  it("does not render dialog content when closed", () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });

  it("opens dialog when trigger is clicked", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    await userEvent.click(trigger);

    expect(screen.getByText("Dialog Title")).toBeInTheDocument();
    expect(screen.getByText("Dialog Description")).toBeInTheDocument();
  });

  it("closes dialog when close button is clicked", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByText("Title")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /close/i });
    await userEvent.click(closeButton);
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });

  it("renders DialogHeader with correct layout classes", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader data-testid="header">Header</DialogHeader>
        </DialogContent>
      </Dialog>
    );
    const header = screen.getByTestId("header");
    expect(header).toHaveClass("flex");
    expect(header).toHaveClass("flex-col");
  });

  it("renders DialogFooter with responsive layout classes", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogFooter data-testid="footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveClass("flex");
    expect(footer).toHaveClass("flex-col-reverse");
    expect(footer).toHaveClass("sm:flex-row");
    expect(footer).toHaveClass("sm:justify-end");
  });

  it("DialogTitle renders with correct styling and is accessible", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Accessible Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const title = screen.getByText("Accessible Title");
    expect(title).toHaveClass("font-display");
    expect(title).toHaveClass("text-lg");
    expect(title).toHaveClass("font-semibold");
    expect(title).toHaveClass("text-[var(--text-primary)]");
  });

  it("DialogDescription renders with secondary color", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    const desc = screen.getByText("Description");
    expect(desc).toHaveClass("text-sm");
    expect(desc).toHaveClass("text-[var(--text-secondary)]");
  });

  it("close button has screen-reader only text", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    const srOnly = within(closeButton).getByText("Close");
    expect(srOnly).toHaveClass("sr-only");
  });

  it("close button has focus ring styling", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toHaveClass("focus:ring-2");
    expect(closeButton).toHaveClass("focus:ring-[var(--accent-primary)]");
  });

  it("dialog content has correct background and border classes", () => {
    render(
      <Dialog defaultOpen>
        <DialogContent data-testid="content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const content = screen.getByTestId("content");
    expect(content).toHaveClass("bg-[var(--bg-surface)]");
    expect(content).toHaveClass("border-[var(--border-subtle)]");
  });

  it("renders full dialog composition with header, content, and footer", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Are you sure?</DialogDescription>
          </DialogHeader>
          <div>Body content</div>
          <DialogFooter>
            <DialogClose asChild>
              <button>Cancel</button>
            </DialogClose>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    await userEvent.click(screen.getByRole("button", { name: /open/i }));

    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
