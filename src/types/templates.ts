// src/types/templates.ts

export type AutoexecTemplate = {
  meta: {
    name: string;
    intro?: string[];
    notes?: string[];
    sectionsOrder: string[];
    sectionsToc: Record<string, string>;
  };
  sections: Record<string, { title: string; lines: string[] }>;
};

export type CrosshairTemplate = {
  meta: { name: string; notes?: string[] };
  lines: string[];
};
