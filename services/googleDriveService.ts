/**
 * SERVICE FOR CENTRALIZED DATA EXPORT
 * 
 * Since the requirement is to save to a specific Drive account WITHOUT the end-user (lifeguard) 
 * logging in, we cannot use Client-Side OAuth (gapi). That requires the user's permission.
 * 
 * To achieve "Save to System Drive", the standard approach is posting the data to a 
 * Webhook (e.g., Google Apps Script Web App, Zapier, or a Node backend).
 * 
 * This service implements the logic to:
 * 1. Force a local download (Data Safety).
 * 2. Attempt to POST the data to a configured Endpoint.
 */

// Placeholder URL. In a real deployment, you would deploy a Google Apps Script
// linked to your Sheet and paste the Web App URL here.
const CENTRAL_WEBHOOK_URL = ''; // e.g. 'https://script.google.com/macros/s/XXX/exec'

export const uploadToCentral = async (fileName: string, csvContent: string): Promise<boolean> => {
  // 1. ALWAYS Force Local Download first (Critical Data Safety)
  try {
    const csvData = "data:text/csv;charset=utf-8," + encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", csvData);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Local download failed", e);
  }

  // 2. Attempt Upload to Central Server (if URL is configured)
  if (CENTRAL_WEBHOOK_URL) {
    try {
      const response = await fetch(CENTRAL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileName,
          content: csvContent,
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors' // Often needed for Google Apps Script Web Hooks
      });
      console.log("Sent to central server", response);
      return true;
    } catch (error) {
      console.error("Error sending to central server:", error);
      // We don't throw here because local download already saved the data
      return false;
    }
  } else {
    console.log("Central Webhook URL not configured. Data saved locally only.");
    return true; // Local save successful
  }
};

// Deprecated functions kept as stubs to prevent import errors if any remain
export const initGoogleDrive = (cb: any) => { if(cb) cb(false); };
export const signInToDrive = async () => false;
export const getDriveToken = () => null;
export const uploadCSVToDrive = async () => "";
