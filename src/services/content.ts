import type { Program, Story } from '../data';
import { programs, stories } from '../data';

export interface StationContentProvider {
  getPrograms(): Promise<Program[]>;
  getStories(): Promise<Story[]>;
}

/**
 * Offline-safe content provider used by the first release. Implement a CMS
 * provider here once DFM supplies its API or RSS endpoint, then swap the
 * exported provider without changing any screen components.
 */
export const contentProvider: StationContentProvider = {
  async getPrograms() {
    return programs;
  },
  async getStories() {
    return stories;
  },
};
