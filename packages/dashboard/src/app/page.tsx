"use client";

import { useRef, useState } from "react";
import { usePanelRef } from "react-resizable-panels";
import { useAtomValue, useSetAtom } from "jotai/react";
import { activePortAtom, sessionsAtom, newSessionDialogAtom } from "@/store/sessions";
import { useSessionsSync } from "@/store/sessions";
import { useStreamSync, hasConsoleErrorsAtom, consoleLogsAtom } from "@/store/stream";
import { useActivitySync } from "@/store/activity";
import { activeExtensionsAtom } from "@/store/sessions";
import { useChatStatusSync } from "@/store/chat";
import { initializeDashboardAccessToken } from "@/lib/dashboard-routes";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Viewport } from "@/components/viewport";
import { ActivityFeed } from "@/components/activity-feed";
import { ChatPanel } from "@/components/chat-panel";
import { ConsolePanel } from "@/components/console-panel";
import { StoragePanel } from "@/components/storage-panel";
import { ExtensionsPanel } from "@/components/extensions-panel";
import { NetworkPanel } from "@/components/network-panel";
import { SessionTree } from "@/components/session-tree";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen, Plus } from "lucide-react";

export default function DashboardPage() {
  initializeDashboardAccessToken();
  const activePort = useAtomValue(activePortAtom);
  useStreamSync(activePort);
  useSessionsSync();
  useActivitySync();
  useChatStatusSync();

  const sessions = useAtomValue(sessionsAtom);
  const hasSessions = sessions.length > 0;
  const setNewSessionDialog = useSetAtom(newSessionDialogAtom);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const hasConsoleErrors = useAtomValue(hasConsoleErrorsAtom);
  const activeExtensions = useAtomValue(activeExtensionsAtom);
  const sidePanelRef = usePanelRef();
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Collapse rather than unmount so the selected tab and panel state are retained.
  const closeSidebar = () => {
    sidePanelRef.current?.collapse();
    sidebarToggleRef.current?.focus();
  };

  const sidePanel = (
    <Tabs defaultValue="chat" className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1 px-2 pt-1">
        <TabsList variant="line" className="h-7 min-w-0 flex-1">
          <TabsTrigger value="chat" className="text-[11px]">Chat</TabsTrigger>
          <TabsTrigger value="activity" className="text-[11px]">Activity</TabsTrigger>
          <TabsTrigger value="console" className="text-[11px]">
            Console
            {hasConsoleErrors && (
              <span className="ml-1 inline-flex size-1.5 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="network" className="text-[11px]">Network</TabsTrigger>
          <TabsTrigger value="storage" className="text-[11px]">Storage</TabsTrigger>
          <TabsTrigger value="extensions" className="text-[11px]">
            Extensions
            {activeExtensions.length > 0 && (
              <span className="ml-1 text-[9px] tabular-nums text-muted-foreground">{activeExtensions.length}</span>
            )}
          </TabsTrigger>
        </TabsList>
        {isDesktop && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            aria-label="Close right sidebar"
            title="Close right sidebar"
            onClick={closeSidebar}
          >
            <PanelRightClose className="size-3.5" />
          </Button>
        )}
      </div>
      <TabsContent value="activity" className="min-h-0 flex-1 overflow-hidden">
        <ActivityFeed />
      </TabsContent>
      <TabsContent value="console" className="min-h-0 flex-1 overflow-hidden">
        <ConsolePanel />
      </TabsContent>
      <TabsContent value="network" className="min-h-0 flex-1 overflow-hidden">
        <NetworkPanel />
      </TabsContent>
      <TabsContent value="storage" className="min-h-0 flex-1 overflow-hidden">
        <StoragePanel />
      </TabsContent>
      <TabsContent value="extensions" className="min-h-0 flex-1 overflow-hidden">
        <ExtensionsPanel />
      </TabsContent>
      <TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
        <ChatPanel />
      </TabsContent>
    </Tabs>
  );

  if (isDesktop) {
    if (!hasSessions) {
      return (
        <div className="flex h-screen flex-col bg-background">
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0 flex-1"
          >
            <ResizablePanel id="sessions" defaultSize="15%" minSize="10%" maxSize="30%">
              <SessionTree />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="empty" defaultSize="85%">
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No active sessions</p>
                    <p className="text-xs text-muted-foreground/60">Create a session to get started</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setNewSessionDialog(true)}
                  >
                    <Plus className="size-3.5" />
                    New session
                  </Button>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      );
    }

    return (
      <div className="flex h-screen flex-col bg-background">
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
        >
          <ResizablePanel id="sessions" defaultSize="15%" minSize="10%" maxSize="30%">
            <SessionTree />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel id="viewport" defaultSize="55%" minSize="30%">
            <Viewport
              footerActions={
                <Button
                  ref={sidebarToggleRef}
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  aria-label={sidebarOpen ? "Close right sidebar" : "Open right sidebar"}
                  title={sidebarOpen ? "Close right sidebar" : "Open right sidebar"}
                  aria-expanded={sidebarOpen}
                  aria-controls="dashboard-right-sidebar"
                  onClick={() => {
                    if (sidePanelRef.current?.isCollapsed()) {
                      sidePanelRef.current.expand();
                    } else {
                      closeSidebar();
                    }
                  }}
                >
                  {sidebarOpen ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
                </Button>
              }
            />
          </ResizablePanel>
          <ResizableHandle className={sidebarOpen ? undefined : "hidden"} />
          <ResizablePanel
            id="dashboard-right-sidebar"
            panelRef={sidePanelRef}
            inert={!sidebarOpen}
            className={sidebarOpen ? undefined : "invisible"}
            defaultSize="30%"
            minSize="15%"
            maxSize="50%"
            collapsible
            collapsedSize={0}
            onResize={(size) => setSidebarOpen(size.asPercentage > 0)}
          >
            {sidePanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Tabs defaultValue="viewport" className="min-h-0 flex-1">
        <div className="shrink-0 px-2 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="viewport">Viewport</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sessions" className="min-h-0 overflow-hidden">
          <SessionTree />
        </TabsContent>
        <TabsContent value="viewport" className="min-h-0 overflow-hidden">
          <Viewport />
        </TabsContent>
        <TabsContent value="activity" className="min-h-0 overflow-hidden">
          {sidePanel}
        </TabsContent>
      </Tabs>
    </div>
  );
}
