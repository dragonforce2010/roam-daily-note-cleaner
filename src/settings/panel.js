import { log } from '../utils/logger';
import { validateTimeFormat } from '../utils/dateUtils';
import { DEFAULT_CLEAN_TIME, DEFAULT_START_DATE } from '../config/constants';

export function createSettingsPanel(extensionAPI, scheduleNextClean) {
  return {
    tabTitle: "Empty Notes Cleaner",
    settings: [
      {
        id: "clean-time",
        name: "Cleaning Time",
        description: "When to clean empty notes (24-hour format, e.g. 02:00)",
        action: { 
          type: "input", 
          placeholder: DEFAULT_CLEAN_TIME,
          onChange: (evt) => {
            const newValue = evt.target.value;
            if (!validateTimeFormat(newValue)) {
              log("Invalid time format. Please use HH:MM format (e.g., 02:00)");
              return;
            }
            extensionAPI.settings.set("clean-time", newValue);
            try {
              const nextRun = scheduleNextClean(newValue, extensionAPI);
              log(`Schedule updated: Next clean scheduled for ${nextRun.toLocaleString()}`);
            } catch (error) {
              log("Error updating schedule:", error);
            }
          }
        }
      },
      {
        id: "start-date",
        name: "Start Date",
        description: "Only clean empty notes after this date (YYYY-MM-DD)",
        action: { 
          type: "input", 
          placeholder: DEFAULT_START_DATE,
          onChange: (evt) => {
            const newValue = evt.target.value;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(newValue) || isNaN(new Date(newValue))) {
              log("Invalid date format. Please use YYYY-MM-DD format");
              return;
            }
            extensionAPI.settings.set("start-date", newValue);
            log(`Start date updated to: ${newValue}`);
          }
        }
      },
      {
        id: "enable-logging",
        name: "Enable Logging",
        description: "Log cleaning activities in your graph",
        action: { 
          type: "switch",
          onChange: (evt) => {
            const isEnabled = evt.target.checked;
            extensionAPI.settings.set("enable-logging", isEnabled);
          }
        }
      }
    ]
  };
} 