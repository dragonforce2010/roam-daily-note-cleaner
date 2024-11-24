import { LOG_PAGE_TITLE } from '../config/constants';
import { log } from '../utils/logger';

export async function createLogEntry(extensionAPI, message) {
  log(`Creating log entry: ${message}`);
  
  try {
    const pageExists = window.roamAlphaAPI.q(`
      [:find ?e
       :where [?e :node/title "${LOG_PAGE_TITLE}"]]
    `);

    let pageUid;
    if (pageExists.length === 0) {
      pageUid = await window.roamAlphaAPI.data.page.create({
        page: { title: LOG_PAGE_TITLE }
      });
      log("Log page created with uid:", pageUid);
    } else {
      const result = window.roamAlphaAPI.q(`
        [:find ?uid
         :where [?e :node/title "${LOG_PAGE_TITLE}"]
                [?e :block/uid ?uid]]
      `);
      pageUid = result[0][0];
    }

    await window.roamAlphaAPI.data.block.create({
      location: {
        "parent-uid": pageUid,
        order: "first"
      },
      block: { string: message }
    });

    log("Log entry created successfully");
  } catch (error) {
    log("Error creating log entry:", error);
    throw error;
  }
} 