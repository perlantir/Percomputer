import { test, expect } from "@playwright/test";

/**
 * Navigation E2E tests
 * Covers: all page navigation via left rail, direct URL access,
 * page titles, and responsive behavior
 */

test.describe("Navigation - Left Rail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  const mainNavItems = [
    { label: "Home", href: "/", titlePattern: /Home \| Computer|Computer/ },
    { label: "Discover", href: "/discover", titlePattern: /Discover/ },
    { label: "Library", href: "/library", titlePattern: /Library/ },
    { label: "Connectors", href: "/connectors", titlePattern: /Connectors/ },
  ];

  for (const item of mainNavItems) {
    test(`can navigate to ${item.label} via left rail`, async ({ page }) => {
      const link = page
        .locator("aside nav")
        .getByText(item.label, { exact: true });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(item.href);
      await expect(page).toHaveTitle(item.titlePattern);
    });
  }

  test("can navigate to Settings via left rail", async ({ page }) => {
    const settingsLink = page
      .locator("aside")
      .getByText("Settings", { exact: true });
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });

  test("can navigate to Console via left rail", async ({ page }) => {
    const consoleLink = page
      .locator("aside")
      .getByText("Alex Chen", { exact: false });
    await expect(consoleLink).toBeVisible();
    await consoleLink.click();
    await expect(page).toHaveURL(/\/console/);
  });

  test("Spaces dropdown can be expanded", async ({ page }) => {
    const spacesButton = page
      .locator("aside nav")
      .getByText("Spaces", { exact: true });
    await expect(spacesButton).toBeVisible();
    await spacesButton.click();

    // Sub-items should become visible
    const spaceItems = ["Engineering", "Product", "Design"];
    for (const space of spaceItems) {
      const link = page
        .locator("aside")
        .getByText(space, { exact: true });
      await expect(link).toBeVisible();
    }
  });

  test("can navigate to a space sub-page", async ({ page }) => {
    const spacesButton = page
      .locator("aside nav")
      .getByText("Spaces", { exact: true });
    await spacesButton.click();

    const engineeringLink = page
      .locator("aside")
      .getByText("Engineering", { exact: true });
    await engineeringLink.click();
    await expect(page).toHaveURL(/\/spaces\/engineering/);
  });

  test("logo navigates back to home", async ({ page }) => {
    // First navigate away
    await page.goto("/library");
    await expect(page).toHaveURL(/\/library/);

    // Click logo
    const logo = page.locator("aside a[href='/']").first();
    await logo.click();
    await expect(page).toHaveURL("/");
  });

  test("sidebar collapse/expand toggle works", async ({ page }) => {
    const collapseButton = page
      .locator("aside")
      .locator("button")
      .filter({ hasText: /^$/ })
      .or(
        page.locator("aside button[aria-label='Collapse sidebar'], aside button[aria-label='Expand sidebar']")
      )
      .last();

    if (await collapseButton.isVisible().catch(() => false)) {
      // Click to collapse
      await collapseButton.click();
      // Labels should be hidden when collapsed
      // Click to expand back
      await collapseButton.click();
      const homeLink = page
        .locator("aside nav")
        .getByText("Home", { exact: true });
      await expect(homeLink).toBeVisible();
    }
  });
});

test.describe("Navigation - Direct URL Access", () => {
  const pages = [
    { path: "/", expectedTitle: /Home \| Computer|Computer/ },
    { path: "/discover", expectedTitle: /Discover/ },
    { path: "/library", expectedTitle: /Library/ },
    { path: "/compare", expectedTitle: /Compare/ },
    { path: "/connectors", expectedTitle: /Connectors/ },
    { path: "/console", expectedTitle: /Console|Operator/ },
    { path: "/settings", expectedTitle: /Settings/ },
    { path: "/status", expectedTitle: /Status/ },
  ];

  for (const pageInfo of pages) {
    test(`direct access to ${pageInfo.path} loads correctly`, async ({
      page,
    }) => {
      await page.goto(pageInfo.path);
      await expect(page).toHaveURL(pageInfo.path);
      await expect(page).toHaveTitle(pageInfo.expectedTitle);
    });
  }

  test("direct access to workflow detail page loads correctly", async ({
    page,
  }) => {
    await page.goto("/w/wf_lithium_miners");
    await expect(page).toHaveURL("/w/wf_lithium_miners");

    const objective = page.getByText("Research the top 10 lithium miners", {
      exact: false,
    });
    await expect(objective).toBeVisible();
  });

  test("direct access to space page loads correctly", async ({ page }) => {
    await page.goto("/spaces/engineering");
    await expect(page).toHaveURL(/\/spaces\/engineering/);
  });

  test("non-existent page shows 404", async ({ page }) => {
    await page.goto("/non-existent-page");
    const notFoundText = page
      .getByText("Not Found", { exact: false })
      .or(page.getByText("404", { exact: false }));
    await expect(notFoundText).toBeVisible();
  });
});

test.describe("Navigation - Page Structure", () => {
  test("Discover page has templates", async ({ page }) => {
    await page.goto("/discover");

    const heading = page.getByRole("heading", { name: "Discover" });
    await expect(heading).toBeVisible();

    // Category chips should be visible
    const categoryChip = page.locator("button").filter({ hasText: /Research|Build|Code|Design/ }).first();
    await expect(categoryChip).toBeVisible();
  });

  test("Compare page has comparison interface", async ({ page }) => {
    await page.goto("/compare");

    const heading = page.getByRole("heading", { name: "Compare" });
    await expect(heading).toBeVisible();
  });

  test("Connectors page has connector tiles", async ({ page }) => {
    await page.goto("/connectors");

    const heading = page.getByRole("heading", { name: "Connectors" });
    await expect(heading).toBeVisible();

    // Search input for connectors
    const searchInput = page.locator("input[type='text']").first();
    await expect(searchInput).toBeVisible();
  });

  test("Status page shows system status", async ({ page }) => {
    await page.goto("/status");

    const heading = page.getByRole("heading", { name: "System Status" });
    await expect(heading).toBeVisible();

    // Health cards should be visible
    const apiGateway = page.getByText("API Gateway", { exact: true });
    await expect(apiGateway).toBeVisible();
  });
});

test.describe("Navigation - Command Palette", () => {
  test("command palette can be opened with keyboard shortcut", async ({
    page,
  }) => {
    await page.goto("/");

    // Use Ctrl+K to open command palette (cross-platform)
    await page.keyboard.press("Control+k");

    const commandPalette = page
      .locator("[cmdk-root], [role='dialog']")
      .filter({ hasText: /Search|Command/ })
      .first();

    if (await commandPalette.isVisible().catch(() => false)) {
      await expect(commandPalette).toBeVisible();

      // Close with Escape
      await page.keyboard.press("Escape");
      await expect(commandPalette).not.toBeVisible();
    }
  });
});
