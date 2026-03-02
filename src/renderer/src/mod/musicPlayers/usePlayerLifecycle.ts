import { onUnmounted } from 'vue';

type CleanupTask = () => void;

export function usePlayerLifecycle() {
  const cleanups: CleanupTask[] = [];
  const timeoutIds = new Set<ReturnType<typeof setTimeout>>();
  let destroyed = false;

  const addCleanup = (task: CleanupTask) => {
    if (destroyed) {
      task();
      return;
    }
    cleanups.push(task);
  };

  const setManagedTimeout = (handler: () => void, ms: number) => {
    const timeoutId = setTimeout(() => {
      timeoutIds.delete(timeoutId);
      if (destroyed) {
        return;
      }
      handler();
    }, ms);
    timeoutIds.add(timeoutId);
    return timeoutId;
  };

  const clearManagedTimeout = (timeoutId: ReturnType<typeof setTimeout> | undefined) => {
    if (!timeoutId) {
      return;
    }
    if (timeoutIds.has(timeoutId)) {
      clearTimeout(timeoutId);
      timeoutIds.delete(timeoutId);
    }
  };

  const isDestroyed = () => destroyed;

  onUnmounted(() => {
    destroyed = true;
    for (const timeoutId of timeoutIds) {
      clearTimeout(timeoutId);
    }
    timeoutIds.clear();

    while (cleanups.length > 0) {
      const task = cleanups.pop();
      try {
        task?.();
      } catch (error) {
        console.error('[PlayerLifecycle] cleanup failed', error);
      }
    }
  });

  return {
    addCleanup,
    clearManagedTimeout,
    isDestroyed,
    setManagedTimeout
  };
}
