'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  type: string;
  role: string;
}

interface WorkspaceStore {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  setActiveWorkspace: (ws: Workspace) => void;
  setWorkspaces: (ws: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      activeWorkspace: null,
      workspaces: [],
      setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),
      setWorkspaces: (workspaces) => set({ workspaces }),
    }),
    { name: 'powerlytic-workspace' }
  )
);
