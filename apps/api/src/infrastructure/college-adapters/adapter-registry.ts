import type { CollegeAdapter } from "@/application/ports/college-adapter.port";

/**
 * Registry of all available college adapters.
 *
 * Adapters register themselves here. The sync system and API layer
 * look up the correct adapter by the `adapter_id` stored in the
 * colleges table.
 */
const registry = new Map<string, CollegeAdapter>();

export const adapterRegistry = {
  /**
   * Register a college adapter. Called once per adapter at startup.
   */
  register(adapter: CollegeAdapter): void {
    if (registry.has(adapter.adapterId)) {
      throw new Error(`Adapter "${adapter.adapterId}" is already registered`);
    }
    registry.set(adapter.adapterId, adapter);
  },

  /**
   * Get an adapter by its ID. Returns undefined if not found.
   */
  get(adapterId: string): CollegeAdapter | undefined {
    return registry.get(adapterId);
  },

  /**
   * Get an adapter by its ID, throwing if not found.
   */
  getOrThrow(adapterId: string): CollegeAdapter {
    const adapter = registry.get(adapterId);
    if (!adapter) {
      throw new Error(`No adapter registered for "${adapterId}"`);
    }
    return adapter;
  },

  /**
   * List all registered adapter IDs.
   */
  listIds(): string[] {
    return Array.from(registry.keys());
  },

  /**
   * Check if an adapter is registered.
   */
  has(adapterId: string): boolean {
    return registry.has(adapterId);
  },

  /**
   * Clear all registered adapters. Used in tests.
   */
  clear(): void {
    registry.clear();
  },
};
