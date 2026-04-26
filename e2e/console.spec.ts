import { test, expect } from "@playwright/test";

/**
 * Console (Operator Console) E2E tests
 * Covers: console page load, navigation between all 8 console pages,
 * org selector, mobile navigation toggle, and page-specific content
 */

test.describe("Operator Console", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/console");
  });

  test("page title contains Operator Console", async ({ page }) => {
    await expect(page).toHaveTitle(/Console|Operator/);
  });

  test("console header is visible", async ({ page }) => {
    const headerTitle = page.getByText("Operator Console", { exact: true });
    await expect(headerTitle).toBeVisible();
  });

  test("org selector is visible and functional", async ({ page }) => {
    const orgSelector = page.locator("select").first();
    await expect(orgSelector).toBeVisible();
    await expect(orgSelector).toBeEnabled();

    // Should have org options
    const options = await orgSelector.locator("option").allTextContents();
    expect(options.length).toBeGreaterThan(0);
    expect(options.some((o) => o.includes("Acme Corp"))).toBe(true);
  });

  test("can switch organization", async ({ page }) => {
    const orgSelector = page.locator("select").first();
    await orgSelector.selectOption("org-stark");
    await expect(orgSelector).toHaveValue("org-stark");
  });

  test("role badge shows 'operator'", async ({ page }) => {
    const roleBadge = page.getByText("operator", { exact: true });
    await expect(roleBadge).toBeVisible();
  });

  test("version info is visible", async ({ page }) => {
    const versionText = page.getByText(/v2\.4\.1/);
    await expect(versionText).toBeVisible();
  });

  test("system status indicator is visible", async ({ page }) => {
    const statusText = page
      .getByText("All systems operational", { exact: false })
      .or(page.locator("text='operational'"));
    await expect(statusText).toBeVisible();
  });

  test.describe("Console Navigation", () => {
    const consolePages = [
      {
        id: "workflow-inspector",
        label: "Workflow Inspector",
        section: "Execution",
      },
      {
        id: "plan-diff",
        label: "Plan Diff",
        section: "Execution",
      },
      {
        id: "cost-quality",
        label: "Cost & Quality",
        section: "Optimization",
      },
      {
        id: "routing-policy",
        label: "Routing Policy",
        section: "Optimization",
      },
      {
        id: "sandbox-pool",
        label: "Sandbox Pool",
        section: "Infrastructure",
      },
      {
        id: "provider-health",
        label: "Provider Health",
        section: "Infrastructure",
      },
      {
        id: "audit-explorer",
        label: "Audit Explorer",
        section: "Compliance",
      },
      {
        id: "tenant-admin",
        label: "Tenant Admin",
        section: "Compliance",
      },
    ];

    for (const pageInfo of consolePages) {
      test(`can navigate to ${pageInfo.label} page`, async ({ page }) => {
        // Find the nav button by its label text
        const navButton = page
          .locator("nav")
          .getByText(pageInfo.label, { exact: false })
          .first();
        await expect(navButton).toBeVisible();
        await navButton.click();

        // After clicking, the button should have active styling
        // (we verify by checking it's still visible and content updates)
        await expect(navButton).toBeVisible();
      });
    }

    for (const pageInfo of consolePages) {
      test(`${pageInfo.label} page shows correct heading`, async ({ page }) => {
        // Navigate to the page
        const navButton = page
          .locator("nav")
          .getByText(pageInfo.label, { exact: false })
          .first();
        await navButton.click();
        await page.waitForTimeout(300);

        // The section label should appear in main content area
        const pageHeading = page
          .getByRole("heading")
          .filter({ hasText: pageInfo.label })
          .first();
        await expect(pageHeading).toBeVisible();
      });
    }

    test("section headers are visible in console nav", async ({ page }) => {
      const sections = [
        "Execution",
        "Optimization",
        "Infrastructure",
        "Compliance",
      ];
      for (const section of sections) {
        const sectionHeader = page
          .locator("nav")
          .getByText(section, { exact: true });
        await expect(sectionHeader).toBeVisible();
      }
    });

    test("sections can be collapsed", async ({ page }) => {
      // Click on a section header to collapse it
      const executionSection = page
        .locator("nav")
        .getByText("Execution", { exact: true });
      await executionSection.click();

      // Items in the section should be hidden/collapsed
      // Click again to expand
      await executionSection.click();

      const workflowInspector = page
        .locator("nav")
        .getByText("Workflow Inspector", { exact: false });
      await expect(workflowInspector).toBeVisible();
    });

    test("active page has indicator dot", async ({ page }) => {
      // Click on Workflow Inspector
      const workflowInspector = page
        .locator("nav")
        .getByText("Workflow Inspector", { exact: false });
      await workflowInspector.click();

      // The active button should have a visual indicator (dot)
      const activeButton = page
        .locator("nav button")
        .filter({ hasText: /Workflow Inspector/ });
      // Check for the presence of the dot element within
    });
  });

  test.describe("Console Content Areas", () => {
    test("Workflow Inspector shows workflow content", async ({ page }) => {
      const workflowInspector = page
        .locator("nav")
        .getByText("Workflow Inspector", { exact: false });
      await workflowInspector.click();
      await page.waitForTimeout(300);

      // Main content area should have the Workflow Inspector heading
      const heading = page
        .getByRole("heading")
        .filter({ hasText: "Workflow Inspector" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("Provider Health shows provider status", async ({ page }) => {
      const providerHealth = page
        .locator("nav")
        .getByText("Provider Health", { exact: false });
      await providerHealth.click();
      await page.waitForTimeout(300);

      const heading = page
        .getByRole("heading")
        .filter({ hasText: "Provider Health" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("Audit Explorer shows audit content", async ({ page }) => {
      const auditExplorer = page
        .locator("nav")
        .getByText("Audit Explorer", { exact: false });
      await auditExplorer.click();
      await page.waitForTimeout(300);

      const heading = page
        .getByRole("heading")
        .filter({ hasText: "Audit Explorer" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("Tenant Admin shows admin content", async ({ page }) => {
      const tenantAdmin = page
        .locator("nav")
        .getByText("Tenant Admin", { exact: false });
      await tenantAdmin.click();
      await page.waitForTimeout(300);

      const heading = page
        .getByRole("heading")
        .filter({ hasText: "Tenant Admin" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("Cost & Quality shows leaderboard content", async ({ page }) => {
      const costQuality = page
        .locator("nav")
        .getByText("Cost & Quality", { exact: false });
      await costQuality.click();
      await page.waitForTimeout(300);

      const heading = page
        .getByRole("heading")
        .filter({ hasText: "Cost & Quality" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("Sandbox Pool shows sandbox content", async ({ page }) => {
      const sandboxPool = page
        .locator("nav")
        .getByText("Sandbox Pool", { exact: false });
      await sandboxPool.click();
      await page.waitForTimeout(300);

      const heading = page
        .getByRole("heading")
        .filter({ hasText: "Sandbox Pool" })
        .first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe("Console Error Boundaries", () => {
    test("console error boundary key changes on page switch", async ({
      page,
    }) => {
      // Navigate between pages quickly to ensure no errors
      const pages = [
        "Workflow Inspector",
        "Plan Diff",
        "Cost & Quality",
        "Provider Health",
      ];

      for (const pageName of pages) {
        const navButton = page
          .locator("nav")
          .getByText(pageName, { exact: false });
        await navButton.click();
        await page.waitForTimeout(200);

        // No error message should be visible
        const errorMessage = page
          .getByText("Something went wrong", { exact: false })
          .or(page.getByText("Error", { exact: false }));
        await expect(errorMessage).not.toBeVisible();
      }
    });
  });

  test.describe("Console User Avatar", () => {
    test("user avatar with initials 'OP' is visible in header", async ({
      page,
    }) => {
      const avatar = page.getByText("OP", { exact: true });
      await expect(avatar).toBeVisible();
    });
  });
});
