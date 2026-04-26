"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ErrorPage } from "@/src/components/ui/error-state";
import { DEMO_SPACES, type DemoSpace } from "@/src/data/demo-spaces";
import { DEMO_USERS } from "@/src/data/demo-users";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { SpaceHeader } from "@/src/components/spaces/SpaceHeader";
import { SpaceWorkflowsTab } from "@/src/components/spaces/SpaceWorkflowsTab";
import { SpaceMemoryTab } from "@/src/components/spaces/SpaceMemoryTab";
import { SpaceArtifactsTab } from "@/src/components/spaces/SpaceArtifactsTab";
import { SpaceSettingsTab } from "@/src/components/spaces/SpaceSettingsTab";

function useSpaceQuery(id: string) {
  return useQuery({
    queryKey: ["space", id],
    queryFn: async () => {
      const space = DEMO_SPACES.find((s) => s.id === id);
      if (!space) throw new Error("Space not found");
      return space;
    },
    initialData: DEMO_SPACES.find((s) => s.id === id),
  });
}

export default function SpacePage() {
  const params = useParams<{ id: string }>();
  const spaceId = params.id;
  const { data: space, isError } = useSpaceQuery(spaceId);
  const [activeTab, setActiveTab] = React.useState("workflows");

  const currentUser = DEMO_USERS[0];
  const isMember = space ? space.memberIds.includes(currentUser.id) : false;

  if (isError || !space) {
    return (
      <ErrorPage
        variant="not-found"
        title="Space not found"
        message="The space you are looking for does not exist."
      />
    );
  }

  if (!isMember) {
    return (
      <ErrorPage
        variant="permission"
        title="Access denied"
        message="You do not have permission to view this space."
      />
    );
  }

  const handleUpdate = React.useCallback(
    (patch: Partial<DemoSpace>) => {
      // In a real app, this would call an API
      // For demo purposes, we just log or could mutate local state
      console.log("Update space", patch);
    },
    []
  );

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-canvas)]">
      <SpaceHeader space={space} onUpdate={handleUpdate} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="animate-fade-in">
            <SpaceWorkflowsTab spaceId={spaceId} />
          </TabsContent>

          <TabsContent value="memory" className="animate-fade-in">
            <SpaceMemoryTab spaceId={spaceId} />
          </TabsContent>

          <TabsContent value="artifacts" className="animate-fade-in">
            <SpaceArtifactsTab spaceId={spaceId} />
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SpaceSettingsTab space={space} onUpdate={handleUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
