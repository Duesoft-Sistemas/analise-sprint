/**
 * Service to manage user preferences and settings
 * Stores configuration in localStorage
 */

const STORAGE_KEY = 'sprint-analysis-config';

export interface AppConfig {
  defaultSelectedDevelopers: string[]; // Developer names or IDs that should be selected by default
  internDevelopers: string[]; // Developer names or IDs that are interns (30h/week instead of 40h)
}

const defaultConfig: AppConfig = {
  defaultSelectedDevelopers: [],
  internDevelopers: [],
};

/**
 * Load configuration from localStorage
 */
export function loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing properties
      return {
        ...defaultConfig,
        ...parsed,
      };
    }
  } catch (error) {
    console.error('Error loading config from localStorage:', error);
  }
  return defaultConfig;
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: Partial<AppConfig>): void {
  try {
    const current = loadConfig();
    const updated = {
      ...current,
      ...config,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
}

/**
 * Get default selected developers
 */
export function getDefaultSelectedDevelopers(): string[] {
  const config = loadConfig();
  return config.defaultSelectedDevelopers || [];
}

/**
 * Set default selected developers
 */
export function setDefaultSelectedDevelopers(developers: string[]): void {
  saveConfig({ defaultSelectedDevelopers: developers });
}

/**
 * Get all available developers from tasks
 */
export function getAllDevelopersFromTasks(tasks: any[]): string[] {
  const devSet = new Set<string>();
  tasks.forEach(task => {
    if (task.responsavel) {
      devSet.add(task.responsavel);
    }
  });
  return Array.from(devSet).sort();
}

/**
 * Get all available developers from worklogs
 */
export function getAllDevelopersFromWorklogs(worklogs: any[], tasks: any[]): string[] {
  const devSet = new Set<string>();
  
  worklogs.forEach(worklog => {
    // Try to find the task to get the developer
    const task = tasks.find(t => 
      String(t.id || '').trim() === String(worklog.taskId).trim() ||
      String(t.chave || '').trim() === String(worklog.taskId).trim()
    );
    
    const developer = task?.responsavel || worklog.responsavel;
    if (developer) {
      devSet.add(developer);
    }
  });
  
  return Array.from(devSet).sort();
}

/**
 * Get list of intern developers
 */
export function getInternDevelopers(): string[] {
  const config = loadConfig();
  return config.internDevelopers || [];
}

/**
 * Set list of intern developers
 */
export function setInternDevelopers(developers: string[]): void {
  saveConfig({ internDevelopers: developers });
}

/**
 * Check if a developer is an intern
 */
export function isInternDeveloper(developerName: string): boolean {
  const interns = getInternDevelopers();
  return interns.includes(developerName);
}

