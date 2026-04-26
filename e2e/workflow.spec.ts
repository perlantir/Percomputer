import { test, expect } from "@playwright/test";

/**
 * Workflow E2E tests
 * Covers: workflow creation via composer, workflow detail page, tab navigation,
 * activity rail, and action buttons
 */

test.describe("Workflow Creation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("can type a prompt in the composer and click run", async ({ page }) => {
    const composer = page.locator("textarea").first();
    await composer.fill(
      "Research the top 10 lithium miners and produce a comparative valuation memo"
    );
    await expect(composer).toHaveValue(
      "Research the top 10 lithium miners and produce a comparative valuation memo"
    );

    // Look for the Run button
    const runButton = page
      .locator("button")
      .filter({ hasText: /Run|Submit|Create/i })
      .first();
    await expect(runButton).toBeVisible();
    await expect(runButton).toBeEnabled();
  });

  test("can trigger a starter chip to start a workflow", async ({ page }) => {
    // Click on a starter chip if visible
    const researchChip = page
      .locator("button")
      .filter({ hasText: /Research/i })
      .first();
    if (await researchChip.isVisible().catch(() => false)) {
      await researchChip.click();
      // Should populate or trigger composer
      const composer = page.locator("textarea").first();
      await expect(composer).toBeFocused();
    }
  });
});

test.describe("Workflow Detail Page", () => {
  test("navigates to workflow detail from home recent cards", async ({
    page,
  }) => {
    await page.goto("/");

    const workflowLink = page.locator("a[href^='/w/']").first();
    if ((await workflowLink.count()) === 0) {
      test.skip();
      return;
    }

    const href = await workflowLink.getAttribute("href");
    await workflowLink.click();
    await expect(page).toHaveURL(href!);
  });

  test("workflow detail page shows correct structure", async ({ page }) => {
    // Navigate directly to a known workflow
    await page.goto("/w/wf_lithium_miners");

    // Wait for page to load (no skeleton)
    await page.waitForSelector("text='Research the top 10 lithium miners'", {
      timeout: 5000,
    });

    // Workflow header with objective should be visible
    const objective = page.getByText(
      "Research the top 10 lithium miners and produce a comparative valuation memo",
      { exact: false }
    );
    await expect(objective).toBeVisible();
  });

  test("workflow detail page has tab navigation", async ({ page }) => {
    await page.goto("/w/wf_lithium_miners");

    // Wait for tabs to appear
    await page.waitForTimeout(600);

    const tabs = ["Answer", "Steps", "Sources", "Artifacts"];
    for (const tabLabel of tabs) {
      const tab = page
        .locator("nav[aria-label='Workflow tabs']")
        .getByText(tabLabel, { exact: true })
        .or(page.getByRole("tab", { name: tabLabel }))
        .or(page.locator("button").filter({ hasText: tabLabel }).first());

      await expect(tab).toBeVisible();
    }
  });

  test("can switch between workflow tabs", async ({ page }) => {
    await page.goto("/w/wf_lithium_miners");
    await page.waitForTimeout(600);

    // Click Steps tab
    const stepsTab = page
      .locator("nav[aria-label='Workflow tabs']")
      .getByText("Steps", { exact: true })
      .or(page.locator("button").filter({ hasText: "Steps" }).first());
    await stepsTab.click();
    await expect(stepsTab).toHaveAttribute("aria-current", "page");

    // Click Sources tab
    const sourcesTab = page
      .locator("nav[aria-label='Workflow tabs']")
      .getByText("Sources", { exact: true })
      .or(page.locator("button").filter({ hasText: "Sources" }).first());
    await sourcesTab.click();
    await expect(sourcesTab).toHaveAttribute("aria-current", "page");

    // Click Artifacts tab
    const artifactsTab = page
      .locator("nav[aria-label='Workflow tabs']")
      .getByText("Artifacts", { exact: true })
      .or(page.locator("button").filter({ hasText: "Artifacts" }).first());
    await artifactsTab.click();
    await expect(artifactsTab).toHaveAttribute("aria-current", "page");
  });

  test("workflow actions (Amend, Share) are visible", async ({ page }) => {
    await page.goto("/w/wf_lithium_miners");
    await page.waitForTimeout(600);

    const amendButton = page
      .locator("button")
      .filter({ hasText: "Amend" })
      .first();
    const shareButton = page
      .locator("button")
      .filter({ hasText: "Share" })
      .first();

    await expect(amendButton).toBeVisible();
    await expect(shareButton).toBeVisible();
  });

  test("activity rail is visible on workflow detail page", async ({ page }) => {
    await page.goto("/w/wf_lithium_miners");
    await page.waitForTimeout(600);

    // The activity rail shows workflow items
    const activityLabel = page.getByText("Activity", { exact: true });
    await expect(activityLabel).toBeVisible();
  });

  test("activity rail can be collapsed and expanded", async ({ page }) => {
    await page.goto("/w/wf_lithium_miners");
    await page.waitForTimeout(600);

    const toggleButton = page
      .locator("button")
      .filter({ hasText: "" })
      .or(page.locator("aside button").first());

    if (await toggleButton.isVisible().catch(() => false)) {
      await toggleButton.click();
      // After collapsing, the "Activity" text should not be visible
      // After expanding again
      await toggleButton.click();
      const activityLabel = page.getByText("Activity", { exact: true });
      await expect(activityLabel).toBeVisible();
    }
  });
});

test.describe("Library Page Workflows", () => {
  test("library page shows workflow list", async ({ page }) => {
    await page.goto("/library");

    // Page heading
    const heading = page.getByRole("heading", { name: "Library" });
    await expect(heading).toBeVisible();

    // Description
    const description = page.getByText(
      "Browse, search, and manage all your workflows"
    );
    await expect(description).toBeVisible();
  });

  test("can search workflows in library", async ({ page }) => {
    await page.goto("/library");

    const searchInput = page
      .locator("input[type='text'], input[placeholder*='Search']")
      .first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("lithium");
      await page.waitForTimeout(300);

      // Should filter results
      const results = page
        .locator("a[href^='/w/'], [data-testid='workflow-item']")
        .or(page.locator("text='lithium'").first());
      await expect(results).toBeVisible();
    }
  });

  test("clicking a workflow in library navigates to detail", async ({
    page,
  }) => {
    await page.goto("/library");
    await page.waitForTimeout(500);

    const workflowLink = page.locator("a[href^='/w/']").first();
    if ((await workflowLink.count()) > 0) {
      const href = await workflowLink.getAttribute("href");
      await workflowLink.click();
      await expect(page).toHaveURL(href!);
    }
  });
});

test.describe("Workflow Not Found", () => {
  test("shows error page for non-existent workflow", async ({ page }) => {
    await page.goto("/w/non-existent-workflow");

    const errorMessage = page.getByText("Workflow not found", {
      exact: false,
    });
    await expect(errorMessage).toBeVisible();

    const backButton = page
      .locator("a")
      .filter({ hasText: "Back to Library" });
    await expect(backButton).toBeVisible();
  });
});
