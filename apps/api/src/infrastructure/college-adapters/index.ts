import { adapterRegistry } from "./adapter-registry";
import { NcuAdapter } from "./ncu/ncu.adapter";

/**
 * Register all available college adapters.
 * Called once at application startup.
 */
export function registerAdapters(): void {
  adapterRegistry.register(new NcuAdapter());
}

export { adapterRegistry } from "./adapter-registry";
