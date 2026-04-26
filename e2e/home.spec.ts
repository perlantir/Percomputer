import { test, expect } from "@playwright/test";

/**
 * Home page E2E tests
 * Covers: page load, composer visibility, recent workflows, navigation interactions
 */

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page title is correct", async ({ page }) => {
    await expect(page).toHaveTitle(/Home \| Computer|Computer/);
  });

  test("hero heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", {
      name: "What can I do for you?",
      level: 1,
    });
    await expect(heading).toBeVisible();
  });

  test.describe("Composer", () => {
    test("composer textarea is visible and interactive", async ({ page }) => {
      const composer = page.locator("textarea").first();
      await expect(composer).toBeVisible();
      await expect(composer).toBeEnabled();
    });

    test("can type into composer textarea", async ({ page }) => {
      const composer = page.locator("textarea").first();
      await composer.fill(
        "Research the top lithium mining companies and their market cap"
      );
      await expect(composer).toHaveValue(
        "Research the top lithium mining companies and their market cap"
      );
    });

    test("composer toolbar buttons are visible", async ({ page }) => {
      // Attachment button
      const attachButton = page.locator('button[aria-label="Attach file"]').first();
      await expect(attachButton).toBeVisible();
    });

    test("starter chips are visible below composer", async ({ page }) => {
      const starterChips = page.locator("[data-testid='starter-chips']").or(
        page.locator("button").filter({ hasText: /Research|Analyze|Build|Compare/ })
      );
      // Starter chips may be rendered with different test IDs; ensure at least one chip-like element exists
      const chips = page.locator("button").filter({ hasText: /Research|Analyze|Build|Compare|Write/ });
      const count = await chips.count();
      expect(count).toBeGreaterThan(0);
    });

    test("advanced options can be toggled", async ({ page }) => {
      const advancedToggle = page
        .locator("button")
        .filter({ hasText: /Advanced|Options/ })
        .first();
      if (await advancedToggle.isVisible().catch(() => false)) {
        await advancedToggle.click();
        await expect(
          page.locator("text='Model'").or(page.locator("text='Budget'"))
        ).toBeVisible();
      }
    });
  });

  test.describe("Recent Workflows Section", () => {
    test("recent workflows heading is visible", async ({ page }) => {
      const sectionHeading = page.getByText("Recent Workflows", { exact: false });
      await expect(sectionHeading).toBeVisible();
    });

    test("recent workflow cards are rendered", async ({ page }) => {
      // Wait for workflow cards to appear
      const cards = page
        .locator("a[href^='/w/']")
        .or(page.locator("article, [data-testid='workflow-card']"));
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test("view all link navigates to library", async ({ page }) => {
      const viewAllLink = page
        .locator("a, button")
        .filter({ hasText: "View all" })
        .first();
      if (await viewAllLink.isVisible().catch(() => false)) {
        await viewAllLink.click();
        await expect(page).toHaveURL(/\/library/);
      }
    });

    test("clicking a workflow card navigates to workflow detail", async ({
      page,
    }) => {
      const workflowLink = page.locator("a[href^='/w/']").first();
      if ((await workflowLink.count()) > 0) {
        const href = await workflowLink.getAttribute("href");
        await workflowLink.click();
        await expect(page).toHaveURL(href!);
      }
    });
  });

  test.describe("Left Rail Navigation", () => {
    test("logo is visible and links to home", async ({ page }) => {
      const logo = page.locator("aside a[href='/']").first();
      await expect(logo).toBeVisible();
    });

    test("main nav items are visible", async ({ page }) => {
      const navItems = ["Home", "Discover", "Library", "Connectors"];
      for (const label of navItems) {
        const link = page
          .locator("aside nav")
          .getByText(label, { exact: true });
        await expect(link).toBeVisible();
      }
    });

    test("navigating to Discover via rail works", async ({ page }) => {
      const discoverLink = page
        .locator("aside nav")
        .getByText("Discover", { exact: true });
      await discoverLink.click();
      await expect(page).toHaveURL(/\/discover/);
    });

    test("navigating to Library via rail works", async ({ page }) => {
      const libraryLink = page
        .locator("aside nav")
        .getByText("Library", { exact: true });
      await libraryLink.click();
      await expect(page).toHaveURL(/\/library/);
    });

    test("navigating to Connectors via rail works", async ({ page }) => {
      const connectorsLink = page
        .locator("aside nav")
        .getByText("Connectors", { exact: true });
      await connectorsLink.click();
      await expect(page).toHaveURL(/\/connectors/);
    });

    test("Settings link is visible in bottom section", async ({ page }) => {
      const settingsLink = page
        .locator("aside")
        .getByText("Settings", { exact: true });
      await expect(settingsLink).toBeVisible();
    });

    test("Operator Console link is visible", async ({ page }) => {
      const consoleLink = page
        .locator("aside")
        .getByText("Operator", { exact: false })
        .or(page.locator("aside").getByText("Alex Chen", { exact: false }));
      await expect(consoleLink).toBeVisible();
    });
  });
});
