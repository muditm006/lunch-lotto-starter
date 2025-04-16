document.addEventListener("DOMContentLoaded", async () => {
    // Load history from storage
    chrome.storage.sync.get(['lunchLottoHistory'], (result) => {
      const history = result.lunchLottoHistory || [];
      renderHistory(history);
    });
  
    // Clear history button
    document.getElementById('clear-history').addEventListener('click', () => {
      chrome.storage.sync.set({ lunchLottoHistory: [] }, () => {
        renderHistory([]);
        swal({
          title: "History cleared!",
          icon: "success",
          button: false,
        });
      });
    });
  });
  
  function renderHistory(history) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
  
    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-history">No history yet. Spin the wheel to add entries!</p>';
      return;
    }
  
    history.reverse().forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const nameLink = document.createElement('a');
      nameLink.href = item.link;
      nameLink.target = '_blank';
      nameLink.textContent = item.name;
      nameLink.className = 'history-name';
      
      const dateSpan = document.createElement('span');
      dateSpan.textContent = item.date;
      dateSpan.className = 'history-date';
      
      historyItem.appendChild(nameLink);
      historyItem.appendChild(dateSpan);
      historyList.appendChild(historyItem);
    });
  }