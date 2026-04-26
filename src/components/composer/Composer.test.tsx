import * as React from "react";
import { describe, it, expect, vi, type Mock, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";
import { SLASH_COMMANDS } from "./SlashMenu";

/* ------------------------------------------------------------------ */
/*  Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockSetText = vi.fn();
const mockSetSlashFilter = vi.fn();
const mockSetSlashMenuOpen = vi.fn();
const mockSetSelectedSlashIndex = vi.fn();
const mockSetIsFocused = vi.fn();
const mockSetAdvancedOpen = vi.fn();
const mockSetWebSearchEnabled = vi.fn();
const mockSetOptions = vi.fn();
const mockSubmit = vi.fn();
const mockAddAttachment = vi.fn();
const mockRemoveAttachment = vi.fn();
const mockToggleConnector = vi.fn();
const mockSetSelectedSpace = vi.fn();

const makeComposerMock = (overrides: Record<string, unknown> = {}) => ({
  text: "",
  setText: mockSetText,
  isFocused: false,
  setIsFocused: mockSetIsFocused,
  attachments: [],
  addAttachment: mockAddAttachment,
  removeAttachment: mockRemoveAttachment,
  webSearchEnabled: false,
  setWebSearchEnabled: mockSetWebSearchEnabled,
  selectedConnectors: [],
  toggleConnector: mockToggleConnector,
  selectedSpace: null,
  setSelectedSpace: mockSetSelectedSpace,
  slashMenuOpen: false,
  setSlashMenuOpen: mockSetSlashMenuOpen,
  slashFilter: "",
  setSlashFilter: mockSetSlashFilter,
  selectedSlashIndex: 0,
  setSelectedSlashIndex: mockSetSelectedSlashIndex,
  advancedOpen: false,
  setAdvancedOpen: mockSetAdvancedOpen,
  options: { budgetCredits: 100, deadline: null, deliverableKinds: [], modelPolicy: null },
  setOptions: mockSetOptions,
  isSubmitting: false,
  error: null,
  submit: mockSubmit,
  canSubmit: false,
  ...overrides,
});

vi.mock("@/src/hooks/useComposer", () => ({
  useComposer: vi.fn(),
}));

vi.mock("./ComposerToolbar", () => ({
  ComposerToolbar: vi.fn(() => React.createElement("div", { "data-testid": "composer-toolbar" })),
}));

vi.mock("./SlashMenu", async () => {
  const actual = await vi.importActual<typeof import("./SlashMenu")>("./SlashMenu");
  return {
    ...actual,
    SlashMenu: vi.fn(() => React.createElement("div", { "data-testid": "slash-menu" })),
  };
});

vi.mock("./AdvancedOptions", () => ({
  AdvancedOptions: vi.fn(() => React.createElement("div", { "data-testid": "advanced-options" })),
}));

vi.mock("./StarterChips", () => ({
  StarterChips: vi.fn(() => React.createElement("div", { "data-testid": "starter-chips" })),
}));

const mockMatchMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });
  mockMatchMedia.mockReturnValue({ matches: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

import { useComposer } from "@/src/hooks/useComposer";

function setupMock(overrides?: Record<string, unknown>) {
  (useComposer as Mock).mockReturnValue(makeComposerMock(overrides));
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("Composer", () => {
  it("renders textarea with correct placeholder", () => {
    setupMock();
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "What would you like Computer to do?");
  });

  it("updates text on user input", async () => {
    setupMock();
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "Hello world");
    expect(mockSetText).toHaveBeenCalledWith("Hello world");
  });

  it("opens slash menu when typing / at start of line", async () => {
    setupMock();
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "/bud");
    expect(mockSetSlashFilter).toHaveBeenCalledWith("bud");
    expect(mockSetSlashMenuOpen).toHaveBeenCalledWith(true);
    expect(mockSetSelectedSlashIndex).toHaveBeenCalledWith(0);
  });

  it("opens slash menu when typing / after whitespace", async () => {
    setupMock({ text: "hello " });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "/sp");
    expect(mockSetSlashFilter).toHaveBeenCalledWith("sp");
    expect(mockSetSlashMenuOpen).toHaveBeenCalledWith(true);
    expect(mockSetSelectedSlashIndex).toHaveBeenCalledWith(0);
  });

  it("does NOT open slash menu when / appears after non-whitespace", async () => {
    setupMock({ text: "hello" });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "/space");
    expect(mockSetSlashMenuOpen).not.toHaveBeenCalledWith(true);
  });

  it("closes slash menu on Escape when open", async () => {
    setupMock({ slashMenuOpen: true });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "{Escape}");
    expect(mockSetSlashMenuOpen).toHaveBeenCalledWith(false);
  });

  it("submits on Cmd+Enter", async () => {
    setupMock({ text: "Run analysis", canSubmit: true });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "{Meta>}{Enter}{/Meta}");
    expect(mockSubmit).toHaveBeenCalled();
  });

  it("submits on Ctrl+Enter", async () => {
    setupMock({ text: "Run analysis", canSubmit: true });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "{Control>}{Enter}{/Control}");
    expect(mockSubmit).toHaveBeenCalled();
  });

  it("disables textarea when submitting", () => {
    setupMock({ isSubmitting: true });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    expect(textarea).toBeDisabled();
  });

  it("marks textarea invalid when error is present", () => {
    setupMock({ error: "Something went wrong" });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "composer-error");
  });

  it("displays error message when error exists", () => {
    setupMock({ error: "Network error occurred" });
    render(<Composer />);
    expect(screen.getByText("Network error occurred")).toBeInTheDocument();
    expect(screen.getByText("Network error occurred").closest("div")).toHaveAttribute("id", "composer-error");
  });

  it("renders attachment pills with remove buttons", () => {
    const attachments = [
      { id: "att-1", name: "report.pdf" },
      { id: "att-2", name: "data.csv" },
    ];
    setupMock({ attachments });
    render(<Composer />);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("data.csv")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove report\.pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove data\.csv/i })).toBeInTheDocument();
  });

  it("calls removeAttachment when clicking remove button", async () => {
    const attachments = [{ id: "att-1", name: "report.pdf" }];
    setupMock({ attachments });
    render(<Composer />);
    const removeBtn = screen.getByRole("button", { name: /remove report\.pdf/i });
    await userEvent.click(removeBtn);
    expect(mockRemoveAttachment).toHaveBeenCalledWith("att-1");
  });

  it("renders ComposerToolbar", () => {
    setupMock();
    render(<Composer />);
    expect(screen.getByTestId("composer-toolbar")).toBeInTheDocument();
  });

  it("renders AdvancedOptions", () => {
    setupMock();
    render(<Composer />);
    expect(screen.getByTestId("advanced-options")).toBeInTheDocument();
  });

  it("renders StarterChips", () => {
    setupMock();
    render(<Composer />);
    expect(screen.getByTestId("starter-chips")).toBeInTheDocument();
  });

  it("renders hidden file input", () => {
    setupMock();
    render(<Composer />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass("hidden");
    expect(fileInput).toHaveAttribute("aria-hidden", "true");
    expect(fileInput).toHaveAttribute("tabIndex", "-1");
  });

  it("handles file selection via hidden input", async () => {
    setupMock();
    render(<Composer />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    await userEvent.upload(fileInput, file);
    expect(mockAddAttachment).toHaveBeenCalledWith(file);
  });

  it("navigates slash menu with ArrowDown", async () => {
    setupMock({ slashMenuOpen: true, slashFilter: "", selectedSlashIndex: 0 });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "{ArrowDown}");
    expect(mockSetSelectedSlashIndex).toHaveBeenCalledWith(expect.any(Function));
  });

  it("navigates slash menu with ArrowUp", async () => {
    setupMock({ slashMenuOpen: true, slashFilter: "", selectedSlashIndex: 1 });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "{ArrowUp}");
    expect(mockSetSelectedSlashIndex).toHaveBeenCalledWith(expect.any(Function));
  });

  it("selects slash command with Enter", async () => {
    setupMock({ slashMenuOpen: true, slashFilter: "", selectedSlashIndex: 0 });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "{Enter}");
    expect(mockSetText).toHaveBeenCalled();
    expect(mockSetSlashMenuOpen).toHaveBeenCalledWith(false);
  });

  it("closes slash menu when typing space after /", async () => {
    setupMock({ text: "/space " });
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.type(textarea, "a");
    expect(mockSetSlashMenuOpen).toHaveBeenCalledWith(false);
    expect(mockSetSlashFilter).toHaveBeenCalledWith("");
  });

  it("applies focus styles to container", () => {
    setupMock();
    render(<Composer />);
    const container = screen.getByRole("textbox", { name: /workflow objective/i }).closest("div");
    expect(container).toBeInTheDocument();
  });

  it("calls setIsFocused on focus and blur", async () => {
    setupMock();
    render(<Composer />);
    const textarea = screen.getByRole("textbox", { name: /workflow objective/i });
    await userEvent.click(textarea);
    expect(mockSetIsFocused).toHaveBeenCalledWith(true);
  });
});

describe("Composer slash commands", () => {
  it("contains all expected slash commands", () => {
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain("space");
    expect(ids).toContain("budget");
    expect(ids).toContain("deadline");
    expect(ids).toContain("format");
    expect(ids).toContain("connector");
  });

  it("slash commands have required fields", () => {
    SLASH_COMMANDS.forEach((cmd) => {
      expect(cmd.id).toBeTruthy();
      expect(cmd.label).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.icon).toBeDefined();
    });
  });
});
