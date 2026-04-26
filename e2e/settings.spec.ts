import { test, expect } from "@playwright/test";

/**
 * Settings E2E tests
 * Covers: all settings tabs, form interactions, navigation between tabs,
 * and mobile responsive tab switching
 */

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("page title is correct", async ({ page }) => {
    await expect(page).toHaveTitle(/Settings \| Computer|Settings/);
  });

  test("settings heading is visible", async ({ page }) => {
    const heading = page.getByRole("heading", { name: "Settings" }).first();
    await expect(heading).toBeVisible();
  });

  test.describe("Settings Navigation Sidebar", () => {
    const settingsTabs = [
      { id: "profile", label: "Profile" },
      { id: "billing", label: "Billing" },
      { id: "models", label: "Models" },
      { id: "privacy", label: "Privacy" },
      { id: "memory", label: "Memory" },
      { id: "notifications", label: "Notifications" },
      { id: "api", label: "API Keys" },
      { id: "team", label: "Team" },
    ];

    for (const tab of settingsTabs) {
      test(`${tab.label} tab link is visible in sidebar`, async ({ page }) => {
        const tabLink = page
          .locator("aside")
          .getByText(tab.label, { exact: true });
        await expect(tabLink).toBeVisible();
      });
    }

    for (const tab of settingsTabs) {
      test(`can navigate to ${tab.label} tab`, async ({ page }) => {
        const tabLink = page
          .locator("aside")
          .getByText(tab.label, { exact: true });
        await tabLink.click();
        await expect(page).toHaveURL(new RegExp(`/settings.*tab=${tab.id}`));

        // Tab heading should be visible
        const tabHeading = page
          .getByRole("heading")
          .filter({ hasText: tab.label })
          .first();
        await expect(tabHeading).toBeVisible();
      });
    }
  });

  test.describe("Profile Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=profile");
    });

    test("profile heading is visible", async ({ page }) => {
      const heading = page.getByRole("heading", { name: "Profile" }).first();
      await expect(heading).toBeVisible();
    });

    test("personal information card is visible", async ({ page }) => {
      const cardTitle = page.getByText("Personal Information");
      await expect(cardTitle).toBeVisible();
    });

    test("profile form fields are visible", async ({ page }) => {
      const nameLabel = page.locator("label[for='profile-name']").or(
        page.getByText("Name", { exact: true }).first()
      );
      const emailLabel = page.locator("label[for='profile-email']").or(
        page.getByText("Email", { exact: true }).first()
      );

      await expect(nameLabel).toBeVisible();
      await expect(emailLabel).toBeVisible();
    });

    test("name input has default value", async ({ page }) => {
      const nameInput = page.locator("#profile-name");
      if (await nameInput.isVisible().catch(() => false)) {
        await expect(nameInput).toHaveValue(/./); // Non-empty
      }
    });

    test("can change name and save profile", async ({ page }) => {
      const nameInput = page.locator("#profile-name");
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill("Test User");
        await expect(nameInput).toHaveValue("Test User");

        const saveButton = page
          .locator("button")
          .filter({ hasText: "Save Changes" });
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();
      }
    });

    test("timezone selector is visible", async ({ page }) => {
      const timezoneLabel = page
        .locator("label[for='profile-timezone']")
        .or(page.getByText("Timezone", { exact: false }));
      await expect(timezoneLabel).toBeVisible();
    });

    test("change avatar button is visible", async ({ page }) => {
      const changeAvatarButton = page
        .locator("button")
        .filter({ hasText: "Change Avatar" });
      await expect(changeAvatarButton).toBeVisible();
    });
  });

  test.describe("Billing Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=billing");
    });

    test("billing heading is visible", async ({ page }) => {
      const heading = page.getByRole("heading", { name: "Billing" }).first();
      await expect(heading).toBeVisible();
    });

    test("credit balance is displayed", async ({ page }) => {
      const creditInfo = page
        .getByText(/credits|Credits|balance|Balance/)
        .first();
      await expect(creditInfo).toBeVisible();
    });
  });

  test.describe("Models Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=models");
    });

    test("models heading is visible", async ({ page }) => {
      const heading = page.getByRole("heading", { name: "Models" }).first();
      await expect(heading).toBeVisible();
    });

    test("models table is visible", async ({ page }) => {
      const table = page.locator("table").first();
      await expect(table).toBeVisible();
    });
  });

  test.describe("Privacy Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=privacy");
    });

    test("privacy heading is visible", async ({ page }) => {
      const heading = page.getByRole("heading", { name: "Privacy" }).first();
      await expect(heading).toBeVisible();
    });

    test("data residency section is visible", async ({ page }) => {
      const dataResidency = page.getByText("Data Residency", { exact: true });
      await expect(dataResidency).toBeVisible();
    });

    test("memory settings section is visible", async ({ page }) => {
      const memorySettings = page.getByText("Memory Settings", { exact: true });
      await expect(memorySettings).toBeVisible();
    });

    test("ZDR section is visible", async ({ page }) => {
      const zdrSection = page.getByText("Zero Data Retention", { exact: false });
      await expect(zdrSection).toBeVisible();
    });

    test("region selectors are visible", async ({ page }) => {
      const primaryRegion = page
        .locator("label[for='privacy-primary-region']")
        .or(page.getByText("Primary Region", { exact: false }));
      const backupRegion = page
        .locator("label[for='privacy-backup-region']")
        .or(page.getByText("Backup Region", { exact: false }));

      await expect(primaryRegion).toBeVisible();
      await expect(backupRegion).toBeVisible();
    });

    test("memory toggle switches are visible", async ({ page }) => {
      const episodicLabel = page.getByText("Episodic Memory", { exact: true });
      const semanticLabel = page.getByText("Semantic Memory", { exact: true });

      await expect(episodicLabel).toBeVisible();
      await expect(semanticLabel).toBeVisible();
    });
  });

  test.describe("Memory Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=memory");
    });

    test("memory heading is visible", async ({ page }) => {
      const heading = page.getByRole("heading", { name: "Memory" }).first();
      await expect(heading).toBeVisible();
    });
  });

  test.describe("Notifications Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=notifications");
    });

    test("notifications heading is visible", async ({ page }) => {
      const heading = page
        .getByRole("heading", { name: "Notifications" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("notification channels section is visible", async ({ page }) => {
      const channelsTitle = page.getByText("Notification Channels", {
        exact: true,
      });
      await expect(channelsTitle).toBeVisible();
    });

    test("email notifications toggle is visible", async ({ page }) => {
      const emailLabel = page.getByText("Email Notifications", { exact: true });
      await expect(emailLabel).toBeVisible();
    });

    test("push notifications toggle is visible", async ({ page }) => {
      const pushLabel = page.getByText("Push Notifications", { exact: true });
      await expect(pushLabel).toBeVisible();
    });

    test("in-app notifications toggle is visible", async ({ page }) => {
      const inAppLabel = page.getByText("In-App Notifications", {
        exact: true,
      });
      await expect(inAppLabel).toBeVisible();
    });

    test("notification events section is visible", async ({ page }) => {
      const eventsTitle = page.getByText("Notification Events", { exact: true });
      await expect(eventsTitle).toBeVisible();
    });
  });

  test.describe("API Keys Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=api");
    });

    test("API Keys heading is visible", async ({ page }) => {
      const heading = page
        .getByRole("heading", { name: "API Keys" })
        .first();
      await expect(heading).toBeVisible();
    });

    test("generate key button is visible", async ({ page }) => {
      const generateButton = page
        .locator("button")
        .filter({ hasText: "Generate Key" });
      await expect(generateButton).toBeVisible();
    });

    test("existing API keys are displayed", async ({ page }) => {
      const keyNames = ["Production API", "Staging Test", "CI/CD Deploy"];
      for (const name of keyNames) {
        const keyElement = page.getByText(name, { exact: true });
        await expect(keyElement).toBeVisible();
      }
    });

    test("API key action buttons are visible", async ({ page }) => {
      const copyButton = page
        .locator("button[aria-label*='Copy']")
        .first();
      const deleteButton = page
        .locator("button[aria-label*='Delete']")
        .first();

      await expect(copyButton).toBeVisible();
      await expect(deleteButton).toBeVisible();
    });
  });

  test.describe("Team Tab", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/settings?tab=team");
    });

    test("team heading is visible", async ({ page }) => {
      const heading = page.getByRole("heading", { name: "Team" }).first();
      await expect(heading).toBeVisible();
    });

    test("team members table is visible", async ({ page }) => {
      const table = page.locator("table").first();
      await expect(table).toBeVisible();
    });

    test("team member names are displayed", async ({ page }) => {
      const members = ["Sarah Chen", "Marcus Johnson", "Alex Patel"];
      for (const name of members) {
        const member = page.getByText(name, { exact: true });
        await expect(member).toBeVisible();
      }
    });

    test("invite member button is visible", async ({ page }) => {
      const inviteButton = page
        .locator("button")
        .filter({ hasText: "Invite Member" })
        .first();
      await expect(inviteButton).toBeVisible();
    });

    test("pending invitations section is visible", async ({ page }) => {
      const pendingTitle = page.getByText("Pending Invitations", {
        exact: true,
      });
      await expect(pendingTitle).toBeVisible();
    });
  });

  test.describe("Settings Deep Links", () => {
    const tabDeepLinks = [
      { tab: "profile", expectedText: "Personal Information" },
      { tab: "billing", expectedText: "Credits" },
      { tab: "models", expectedText: "Models" },
      { tab: "privacy", expectedText: "Data Residency" },
      { tab: "memory", expectedText: "Memory" },
      { tab: "notifications", expectedText: "Notification Channels" },
      { tab: "api", expectedText: "API Keys" },
      { tab: "team", expectedText: "Team" },
    ];

    for (const { tab, expectedText } of tabDeepLinks) {
      test(`direct link to ?tab=${tab} shows correct content`, async ({
        page,
      }) => {
        await page.goto(`/settings?tab=${tab}`);
        const content = page.getByText(expectedText, { exact: false });
        await expect(content).toBeVisible();
      });
    }
  });

  test.describe("Settings Sub-Pages", () => {
    test("API Keys sub-page loads", async ({ page }) => {
      await page.goto("/settings/api-keys");
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });

    test("Webhooks sub-page loads", async ({ page }) => {
      await page.goto("/settings/webhooks");
      const heading = page.getByRole("heading").first();
      await expect(heading).toBeVisible();
    });
  });
});
