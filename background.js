async function onUpdated(tabId, changeInfo, tab) {
  if (changeInfo.status !== "complete") {
    return;
  }
  if (!tab.url) {
    return;
  }
  if (!tab.url.startsWith('https://redash')) {
    return;
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["dashboard.js"],
  });
}

chrome.tabs.onUpdated.addListener(onUpdated);
