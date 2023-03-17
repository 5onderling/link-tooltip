// maybe use downloads api for local files (starting with file:// probably) or simply a with download attribute (not header, cause no network)
import * as mime from 'mime/lite';

const urlToFilename: Record<string, string> = {};
chrome.webRequest.onHeadersReceived.addListener(
  ({ url, responseHeaders }) => {
    const contentType = responseHeaders?.find((h) => h.name === 'content-type')?.value;
    if (!contentType) return;

    let extension = mime.getExtension(contentType);
    if (!extension) return;
    if (extension === 'jpeg') extension = 'jpg';

    const urlObj = new URL(url);
    const filename = urlObj.pathname.split('/').pop();
    const filenameWithoutExtension = filename.includes('.')
      ? filename.split('.').slice(0, -1).join('.')
      : filename;

    urlToFilename[url] = `${filenameWithoutExtension}.${extension}`;
  },
  { urls: ['<all_urls>'], types: [chrome.declarativeNetRequest.ResourceType.IMAGE] },
  ['responseHeaders'],
);

const downloadedHeaderKey = 'x-chrome-extension-downloaded-header';
const downloadedHeaderValue = 'true';
const downloadedRuleId = 1;

chrome.runtime.onMessage.addListener((url: string, _, sendResposnse) => {
  if (url.startsWith('file://')) {
    chrome.downloads.download({ url });
    return sendResposnse(false);
  }

  const filename = urlToFilename[url];
  if (!filename) return sendResposnse(false);

  const rule: chrome.declarativeNetRequest.Rule = {
    id: downloadedRuleId,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      responseHeaders: [
        {
          operation: chrome.declarativeNetRequest.HeaderOperation.SET,
          header: 'Content-Disposition',
          value: `attachment; filename=${filename}`,
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
