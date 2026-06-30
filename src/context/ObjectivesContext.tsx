import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { mockObjectives } from '../data/objectives';
import type { Objective } from '../types';

interface CreateObjectiveInput {
  fullName: string;
  title?: string;
  organization?: string;
  country?: string;
  project?: string;
  priority?: Objective['priority'];
  status?: Objective['status'];
  biography?: string;
  personalInterests?: string[];
  professionalInterests?: string[];
  analystNotes?: string;
}

interface ObjectivesContextValue {
  objectives: Objective[];
  addObjective: (input: CreateObjectiveInput) => Objective;
  findObjectiveByName: (name: string) => Objective | undefined;
}

const STORAGE_KEY = 'kle-objectives';

const ObjectivesContext = createContext<ObjectivesContextValue | undefined>(undefined);

function readObjectives(): Objective[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockObjectives));
    return mockObjectives;
  }

  try {
    const parsed = JSON.parse(raw) as Objective[];
    return parsed.length > 0 ? parsed : mockObjectives;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockObjectives));
    return mockObjectives;
  }
}

function writeObjectives(objectives: Objective[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(objectives));
}

export function ObjectivesProvider({ children }: { children: React.ReactNode }) {
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    setObjectives(readObjectives());
  }, []);

  const value = useMemo<ObjectivesContextValue>(
    () => ({
      objectives,
      addObjective: (input) => {
        const now = new Date().toISOString();
        const createdObjective: Objective = {
          id: `obj-${Date.now()}`,
          fullName: input.fullName.trim(),
          title: input.title?.trim() || 'Pendiente de clasificar',
          organization: input.organization?.trim() || 'Organización no especificada',
          country: input.country?.trim() || 'No definido',
          project: input.project?.trim() || 'Sin proyecto asignado',
          priority: input.priority ?? 'medium',
          status: input.status ?? 'active',
          photoUrl: '',
          biography: input.biography?.trim() || 'Perfil pendiente de completar por el analista.',
          personalInterests: input.personalInterests ?? [],
          professionalInterests: input.professionalInterests ?? [],
          analystNotes: input.analystNotes?.trim() || 'Sin observaciones iniciales.',
          createdAt: now,
          updatedAt: now,
        };

        const nextObjectives = [...objectives, createdObjective];
        setObjectives(nextObjectives);
        writeObjectives(nextObjectives);
        return createdObjective;
      },
      findObjectiveByName: (name) =>
        objectives.find((objective) => objective.fullName.toLowerCase() === name.trim().toLowerCase()),
    }),
    [objectives]
  );

  return <ObjectivesContext.Provider value={value}>{children}</ObjectivesContext.Provider>;
}

export function useObjectives() {
  const context = useContext(ObjectivesContext);
  if (!context) {
    throw new Error('useObjectives debe usarse dentro de ObjectivesProvider');
  }

  return context;
}
