import { log } from '../utils/logger';
import { DEFAULT_START_DATE } from '../config/constants';

function parseDailyNoteDate(title) {
  log(`Parsing daily note date for title: ${title}`);
  const pattern = /^([A-Z][a-z]+) (\d{1,2})(?:st|nd|rd|th), (\d{4})$/;
  const match = title?.match(pattern);
  if (!match) return null;

  const [_, month, day, year] = match;
  const monthIndex = new Date(`${month} 1, 2000`).getMonth();
  return new Date(parseInt(year), monthIndex, parseInt(day));
}

export async function getDailyNotes() {
  log("Fetching daily notes...");
  try {
    const allPages = window.roamAlphaAPI.q(`
      [:find (pull ?e [:node/title :block/uid])
       :where 
       [?e :node/title ?title]]
    `);

    // log(`Found ${allPages.length} pages`, allPages);

    const startDate = new Date(DEFAULT_START_DATE);
    log(`Using start date: ${startDate.toLocaleDateString()}`);
    
    const dailyNotes = allPages
      .filter(([page]) => {
        const title = page.title;
        const noteDate = parseDailyNoteDate(title);
        // log(`Parsed date for ${title}: ${noteDate ? noteDate.toLocaleDateString() : 'null'}`);
        if (!noteDate) return false;

        const isAfterStartDate = noteDate >= startDate;
        const isNoteTodayOrFutureDate = noteDate <  new Date();
        if (isAfterStartDate && isNoteTodayOrFutureDate) {
          log(`Found valid daily note: ${title} (${noteDate.toLocaleDateString()})`);
          return true
        }
        return false;
      })
      .map(([page]) => ({
        title: page.title,
        uid: page.uid
      }));

    log(`Found ${dailyNotes.length} daily notes after ${startDate.toLocaleDateString()}`);
    return dailyNotes;
  } catch (error) {
    log("Error fetching daily notes:", error);
    throw error;
  }
}

export async function isPageEmpty(uid) {
  try {
    const blocks = window.roamAlphaAPI.q(`
      [:find ?string
       :where 
       [?page :block/uid "${uid}"]
       [?block :block/page ?page]
       [?block :block/string ?string]]
    `);

    // log(`Found ${blocks.length} blocks for page ${uid}`, blocks);

    return blocks.filter(b => b?.trim() !== '').length === 0;
  } catch (error) {
    log(`Error checking page: ${error}`);
    return true;
  }
}

export async function deletePage(uid) {
  try {
    log(`Attempting to delete page with uid: ${uid}`);
    
    await window.roamAlphaAPI.data.page.delete({
      page: { uid }
    });

    log(`Successfully deleted page with uid: ${uid}`);
    return true;
  } catch (error) {
    log(`Error deleting page with uid ${uid}:`, error);
    return false;
  }
} 