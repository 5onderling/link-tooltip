chrome.runtime.onMessage.addListener((url, _, sendResposnse) => {
  chrome.downloads.download({ url });
  sendResposnse();
  return true;
});
