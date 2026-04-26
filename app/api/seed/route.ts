import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * POST /api/seed
 * Seeds the database with demo data (workflows, tasks, users, etc.)
 * Call once after initial deployment.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for admin secret to prevent unauthorized seeding
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.SEED_SECRET || "setup-seed-2024";

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized — use header: Authorization: Bearer setup-seed-2024" }, { status: 401 });
    }

    // Clear existing data (optional — for fresh start)
    // await prisma.taskEdge.deleteMany();
    // await prisma.taskAttempt.deleteMany();
    // await prisma.task.deleteMany();
    // await prisma.workflow.deleteMany();
    // await prisma.user.deleteMany();

    // Seed users
    const user = await prisma.user.upsert({
      where: { email: "demo@computer.ai" },
      update: {},
      create: {
        id: "user-1",
        email: "demo@computer.ai",
        name: "Demo User",
        role: "owner",
        orgId: "org-1",
      },
    });

    // Seed org
    await prisma.org.upsert({
      where: { id: "org-1" },
      update: {},
      create: {
        id: "org-1",
        name: "Acme Corp",
        slug: "acme",
        settings: {},
        residency: "us-east-1",
      },
    });

    // Seed spaces
    const space = await prisma.space.upsert({
      where: { id: "space-1" },
      update: {},
      create: {
        id: "space-1",
        name: "Acme Account Research",
        description: "Research workflows for Acme accounts",
        orgId: "org-1",
        userId: "user-1",
        systemPrompt: "You are a financial analyst...",
        collaboratorIds: [],
      },
    });

    // Seed a sample workflow
    const workflow = await prisma.workflow.upsert({
      where: { id: "wf-1" },
      update: {},
      create: {
        id: "wf-1",
        userId: "user-1",
        orgId: "org-1",
        spaceId: "space-1",
        status: "succeeded",
        objective: "Research the top 10 lithium miners and produce a comparative valuation memo",
        budgetCredits: 5000,
        spentCredits: 1240,
        deadline: null,
        metadata: {},
      },
    });

    // Seed tasks
    const taskKinds = ["research", "extract", "synthesize", "code_author", "verify"];
    const taskStatuses = ["succeeded", "succeeded", "running", "succeeded", "pending"];

    for (let i = 0; i < 5; i++) {
      await prisma.task.upsert({
        where: { id: `task-${i + 1}` },
        update: {},
        create: {
          id: `task-${i + 1}`,
          workflowId: workflow.id,
          kind: taskKinds[i],
          status: taskStatuses[i],
          spec: { objective: `Task ${i + 1} for lithium research`, model: "gpt-4" },
          resultRef: i < 3 ? `artifact-${i + 1}` : null,
          error: null,
          startedAt: new Date(Date.now() - (5 - i) * 60000),
          endedAt: i < 3 ? new Date(Date.now() - (4 - i) * 60000) : null,
        },
      });
    }

    // Seed artifacts
    const artifactKinds = ["report_md", "dataset_csv", "image_png", "code_diff"];
    for (let i = 0; i < 4; i++) {
      await prisma.artifact.upsert({
        where: { id: `artifact-${i + 1}` },
        update: {},
        create: {
          id: `artifact-${i + 1}`,
          workflowId: workflow.id,
          taskId: `task-${i + 1}`,
          kind: artifactKinds[i],
          uri: `https://storage.example.com/artifact-${i + 1}`,
          sizeBytes: 1024 * (i + 1) * 10,
          sha256: "abc123" + i,
          schemaRef: null,
          createdAt: new Date(),
        },
      });
    }

    // Count records
    const counts = {
      users: await prisma.user.count(),
      orgs: await prisma.org.count(),
      spaces: await prisma.space.count(),
      workflows: await prisma.workflow.count(),
      tasks: await prisma.task.count(),
      artifacts: await prisma.artifact.count(),
    };

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      counts,
    });

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error during seeding",
    }, { status: 500 });
  }
}

/**
 * GET /api/seed
 * Check seed status (counts records)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const counts = {
      users: await prisma.user.count(),
      orgs: await prisma.org.count(),
      spaces: await prisma.space.count(),
      workflows: await prisma.workflow.count(),
      tasks: await prisma.task.count(),
      artifacts: await prisma.artifact.count(),
    };
    return NextResponse.json({ seeded: counts.workflows > 0, counts });
  } catch {
    return NextResponse.json({ seeded: false, counts: {} });
  }
}
