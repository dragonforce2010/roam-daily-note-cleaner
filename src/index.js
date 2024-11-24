import { log } from './utils/logger';
import { DEBUG, DEFAULT_CLEAN_TIME } from './config/constants';
import { createSettingsPanel } from './settings/panel';
import { getDailyNotes, isPageEmpty, deletePage } from './services/noteService';
import { createLogEntry } from './services/logService';
import { calculateNextRunTime } from './utils/dateUtils';

let cleaningInterval;

async function cleanEmptyDailyNotes(extensionAPI) {
  log("Starting cleaning process...");
  try {
    const dailyNotes = await getDailyNotes();
    log(`Found ${dailyNotes.length} empty daily notes`, dailyNotes);
    let cleanCount = 0;
    let cleanedPages = []

    for (const { uid, title } of dailyNotes) {
      const isEmpty = await isPageEmpty(uid)
      if(!isEmpty) {
        log(`Page ${title} (${uid}) is not empty`);
        continue
      }

      log(`Deleting page: ${title} (${uid})`);
      const deleted = await deletePage(uid);
      if (deleted) {
        cleanCount++;
        cleanedPages.push(title);
        log(`Deleted page: ${title}`);
      }
    }

    if (cleanCount > 0 && extensionAPI.settings?.get("enable-logging")) {
      await createLogEntry(extensionAPI,
        `Cleaned ${cleanCount} empty daily notes at ${new Date().toLocaleString()}, cleaned pages are as follows: ${cleanedPages.join(", ")}`,
      );
    }
  } catch (error) {
    log("Error during cleaning process:", error);
  }
}

function scheduleNextClean(nextCleanTime, extensionAPI) {
  const cleanTime = nextCleanTime || extensionAPI.settings?.get("clean-time") || DEFAULT_CLEAN_TIME;
  const [hours, minutes] = cleanTime.split(":").map(Number);
  const nextRun = calculateNextRunTime(hours, minutes);
  const msToNextRun = nextRun.getTime() - Date.now();

  if (cleaningInterval) {
    clearTimeout(cleaningInterval);
    clearInterval(cleaningInterval);
  }

  cleaningInterval = setTimeout(() => {
    cleanEmptyDailyNotes(extensionAPI);
    cleaningInterval = setInterval(() =>cleanEmptyDailyNotes(extensionAPI), 24 * 60 * 60 * 1000);
  }, msToNextRun);

  return nextRun;
}

function onload({ extensionAPI }) {
  log("Plugin loading...");
  log('extensionAPI', extensionAPI);
  
  extensionAPI.settings.panel.create(createSettingsPanel(extensionAPI, scheduleNextClean));
  scheduleNextClean(null, extensionAPI);

  if (DEBUG) {
    window.emptyNotesCleaner = {
      cleanNow: () => cleanEmptyDailyNotes(extensionAPI),
      getScheduleInfo: () => ({
        cleanTime: extensionAPI.settings?.get("clean-time") || DEFAULT_CLEAN_TIME,
        enableLogging: extensionAPI.settings?.get("enable-logging"),
        nextRun: new Date(Date.now() + (cleaningInterval?._idleTimeout || 0)).toLocaleString()
      })
    };
  }
}

function onunload() {
  log("Plugin unloading...");
  if (cleaningInterval) {
    clearTimeout(cleaningInterval);
    clearInterval(cleaningInterval);
  }
  log("Plugin unloaded successfully");
}

export default {
  onload,
  onunload
}; 