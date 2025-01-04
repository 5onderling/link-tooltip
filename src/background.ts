const downloadedHeaderKey = 'x-chrome-extension-downloaded-header';
const downloadedHeaderValue = 'true';
const downloadedRuleId = 1;

chrome.runtime.onMessage.addListener((url: string, _, sendResposnse) => {
  if (url.startsWith('file://')) {
    chrome.downloads.download({ url });
    return sendResposnse(false);
  }

  const rule: chrome.declarativeNetRequest.Rule = {
    id: downloadedRuleId,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      responseHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: 'Content-Disposition',
          value: `attachment;`,
        },
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: downloadedHeaderKey,
          value: downloadedHeaderValue,
        },
      ],
    },
    condition: {
      urlFilter: url,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };

  chrome.declarativeNetRequest
    .updateDynamicRules({ removeRuleIds: [downloadedRuleId], addRules: [rule] })
    .then(() => sendResposnse(true));
  return true;
});

const removeRule = ({ responseHeaders }: chrome.webRequest.WebResponseCacheDetails) => {
  const downloadRequest = responseHeaders?.find((h) => h.name === downloadedHeaderKey)?.value;
  if (downloadRequest !== downloadedHeaderValue) return;

  chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [downloadedRuleId] });
};
const removeRuleRequestFilter: chrome.webRequest.RequestFilter = {
  urls: ['<all_urls>'],
  types: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
};
chrome.webRequest.onCompleted.addListener(removeRule, removeRuleRequestFilter, ['responseHeaders']);
chrome.webRequest.onErrorOccurred.addListener(removeRule, removeRuleRequestFilter, [
  'extraHeaders',
]);
