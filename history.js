document.addEventListener("DOMContentLoaded", async () => {

  // Load the saved lunch history from Chrome's synchronized storage
  chrome.storage.sync.get(['lunchLottoHistory'], (result) => {
    // Use the saved history if available, otherwise default to an empty array
    const history = result.lunchLottoHistory || [];
    // Display the history on the page
    renderHistory(history);
  });

  document.getElementById('clear-history').addEventListener('click', () => {
    // Clear the history in Chrome storage
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

/**
 * Renders the lunch history list on the page.
 */
function renderHistory(history) {
  // Get the container element where history items will be added
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';

  // If the history is empty, show a placeholder message
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-history">No history yet. Spin the wheel to add entries!</p>';
    return;
  }

  // Reverse the history array so the most recent entries appear first
  history.reverse().forEach(item => {
    // Create a new div for each history item
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    // Create a clickable link for the name of the lunch spot
    const nameLink = document.createElement('a');
    nameLink.href = item.link;      
    nameLink.target = '_blank';     
    nameLink.textContent = item.name; 
    nameLink.className = 'history-name';

    // Create a span to display the date of the entry
    const dateSpan = document.createElement('span');
    dateSpan.textContent = item.date;
    dateSpan.className = 'history-date';

    historyItem.appendChild(nameLink);
    historyItem.appendChild(dateSpan);
    historyList.appendChild(historyItem);
  });
}
