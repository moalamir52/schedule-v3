// Simple cache for scheduled tasks
let tasksCache = null;
let cacheTime = 0;
const CACHE_TTL = 15000; // 15 seconds

function getCachedTasks() {
  if (tasksCache && (Date.now() - cacheTime) < CACHE_TTL) {
    return tasksCache;
  }
  return null;
}

function setCachedTasks(tasks) {
  tasksCache = tasks;
  cacheTime = Date.now();
}

function clearTasksCache() {
  tasksCache = null;
  cacheTime = 0;
}

module.exports = { getCachedTasks, setCachedTasks, clearTasksCache };