import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClarificationCard } from "./ClarificationCard";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...rest }: any) => (
      <div className={className} {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => true,
}));

vi.mock("lucide-react", () => ({
  AlertCircle: () => <svg data-testid="icon-alert" />,
  Send: () => <svg data-testid="icon-send" />,
  SkipForward: () => <svg data-testid="icon-skip" />,
}));

vi.mock("@/src/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/src/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, className }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ),
}));

vi.mock("@/src/components/ui/textarea", () => ({
  Textarea: ({ value, onChange, placeholder, rows, className }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  ),
}));

/* ------------------------------------------------------------------ */
/*  Demo data                                                           */
/* ------------------------------------------------------------------ */

const DEMO_QUESTION = "Which region should I focus the analysis on?";

const DEMO_OPTIONS = [
  { value: "na", label: "North America" },
  { value: "eu", label: "Europe" },
  { value: "apac", label: "Asia-Pacific" },
];

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("ClarificationCard", () => {
  it("renders the question text", () => {
    render(<ClarificationCard question={DEMO_QUESTION} onSend={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(DEMO_QUESTION)).toBeInTheDocument();
  });

  it("renders header text", () => {
    render(<ClarificationCard question={DEMO_QUESTION} onSend={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText("Computer needs your input")).toBeInTheDocument();
    expect(screen.getByText("Your answer will help the agent continue")).toBeInTheDocument();
  });

  it("renders radio options when provided", () => {
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    DEMO_OPTIONS.forEach((opt) => {
      expect(screen.getByLabelText(opt.label)).toBeInTheDocument();
    });
  });

  it("renders free-text textarea when no options are provided", () => {
    render(<ClarificationCard question={DEMO_QUESTION} onSend={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument();
  });

  it("renders free-text textarea when allowFreeText is true alongside options", () => {
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        allowFreeText
        onSend={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(DEMO_OPTIONS.length);
  });

  it("sends selected option on Send click", () => {
    const onSend = vi.fn();
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={onSend}
        onSkip={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Europe"));
    fireEvent.click(screen.getByText("Send"));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("eu");
  });

  it("sends free-text when typed and Send clicked", () => {
    const onSend = vi.fn();
    render(<ClarificationCard question={DEMO_QUESTION} onSend={onSend} onSkip={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(textarea, { target: { value: "  My custom answer  " } });
    fireEvent.click(screen.getByText("Send"));
    expect(onSend).toHaveBeenCalledWith("My custom answer");
  });

  it("calls onSkip when Skip button is clicked", () => {
    const onSkip = vi.fn();
    render(<ClarificationCard question={DEMO_QUESTION} onSend={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("disables Send button when no option selected and text is empty", () => {
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    const sendBtn = screen.getByText("Send").closest("button");
    expect(sendBtn).toBeDisabled();
  });

  it("enables Send button after selecting an option", () => {
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Asia-Pacific"));
    const sendBtn = screen.getByText("Send").closest("button");
    expect(sendBtn).not.toBeDisabled();
  });

  it("enables Send button after typing free text", () => {
    render(<ClarificationCard question={DEMO_QUESTION} onSend={vi.fn()} onSkip={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(textarea, { target: { value: "x" } });
    const sendBtn = screen.getByText("Send").closest("button");
    expect(sendBtn).not.toBeDisabled();
  });

  it("does not call onSend when disabled Send is clicked", () => {
    const onSend = vi.fn();
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={onSend}
        onSkip={vi.fn()}
      />
    );
    const sendBtn = screen.getByText("Send").closest("button");
    if (sendBtn) {
      fireEvent.click(sendBtn);
    }
    expect(onSend).not.toHaveBeenCalled();
  });

  it("uses correct radio group name", () => {
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute("name", "clarification");
    });
  });

  it("allows changing selected option", () => {
    const onSend = vi.fn();
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        onSend={onSend}
        onSkip={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("North America"));
    fireEvent.click(screen.getByLabelText("Europe"));
    fireEvent.click(screen.getByText("Send"));
    expect(onSend).toHaveBeenCalledWith("eu");
  });

  it("prefers selected option over free text when both present", () => {
    const onSend = vi.fn();
    render(
      <ClarificationCard
        question={DEMO_QUESTION}
        options={DEMO_OPTIONS}
        allowFreeText
        onSend={onSend}
        onSkip={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("Asia-Pacific"));
    const textarea = screen.getByPlaceholderText("Type your answer...");
    fireEvent.change(textarea, { target: { value: "overridden text" } });
    fireEvent.click(screen.getByText("Send"));
    expect(onSend).toHaveBeenCalledWith("apac");
  });
});
