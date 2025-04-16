const apiKey = "AIzaSyACKFjtEFbq_Joo-NPi1eMtlMMh1UyFLW8";
// 🗂️ Initialize an empty array to store the lunch history entries
let history = [];
const defaultSettings = {
  distance: 0.5,
  price: "2,3",
  dietary: "",
};

function milesToMeters(miles) {
  return miles * 1609.34;
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (settings) => {
      resolve(settings);
    });
  });
}

function showProgress() {
  document.getElementById("progress-container").style.display = "block";
  document.getElementById("wheel").style.display = "none";
  document.getElementById("spin").style.display = "none";
  updateProgress(0);
}

function hideProgress() {
  document.getElementById("progress-container").style.display = "none";
  document.getElementById("wheel").style.display = "block";
  document.getElementById("spin").style.display = "block";
}

function updateProgress(percent) {
  const progressBar = document.querySelector('#progress-bar');
  progressBar.style.width = `${percent}%`;
  document.getElementById("progress-text").textContent = 
    percent < 100 ? `Fetching restaurants... ${percent}%` : "Processing results...";
}

async function fetchRestaurants() {
  try {
    showProgress();

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      const settings = await loadSettings();

      updateProgress(10);

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${milesToMeters(settings.distance)}&type=restaurant&keyword=healthy&minprice=${settings.price[0]}&maxprice=${settings.price[2]}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      let currentProgress = 10;
      updateProgress(currentProgress);

      // Simulate a slow loading animation up to 90%
      const simulateLoading = new Promise((resolve) => {
        const interval = setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += 2;
            updateProgress(currentProgress);
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 100); // Adjust for speed of fill (100ms per tick)
      });

      await simulateLoading;

      if (!data.results || data.results.length === 0) {
        console.error("❌ No restaurants found!");
        hideProgress();
        alert("No restaurants found! Try adjusting your settings.");
        return;
      }

      updateProgress(90);

      let restaurants = data.results.map((place) => ({
        name: place.name,
        distance: (settings.distance).toFixed(1),
        price: place.price_level ? "$".repeat(place.price_level) : "Unknown",
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        placeId: place.place_id,
        googleMapsLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      }));

      // Final processing
      updateProgress(95);

      const seen = new Set();
      restaurants = restaurants.filter((restaurant) => {
        if (seen.has(restaurant.name)) return false;
        seen.add(restaurant.name);
        return true;
      });

      console.log("✅ Unique Restaurants fetched:", restaurants);

      restaurantDetails = restaurants.reduce((acc, r) => {
        acc[r.name] = r;
        return acc;
      }, {});

      updateProgress(100);

      setTimeout(() => {
        hideProgress();
        updateWheel(restaurants);
      }, 1000); // Brief pause for dramatic effect after reaching 100%
    }, (error) => {
      console.error("❌ Geolocation error:", error);
      hideProgress();
      alert("Please enable location access to fetch restaurants.");
    });

  } catch (error) {
    console.error("❌ Error fetching restaurants:", error);
    hideProgress();
  }
}

function updateWheel(restaurants) {
  options.length = 0;

  const shuffledRestaurants = [...restaurants].sort(() => Math.random() - 0.5);
  const selectedRestaurants = shuffledRestaurants.slice(0, 8);

  options.push(...selectedRestaurants.map((restaurant) => ({
    name: restaurant.name,
    googleMapsLink: restaurant.googleMapsLink,
  })));

  console.log("✅ Options for the Wheel:", options);

  restaurantDetails = selectedRestaurants.map((restaurant) => ({
    name: restaurant.name,
    googleMapsLink: restaurant.googleMapsLink
  }));

  console.log("✅ Selected Restaurants for the Wheel:", restaurantDetails);

  drawWheel();
}

function showSettings() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("settings-view").style.display = "block";
}

function hideSettings() {
  document.getElementById("main-view").style.display = "block";
  document.getElementById("settings-view").style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchRestaurants();

  document.getElementById("spin").addEventListener("click", () => spin());
  document.getElementById("open-settings").addEventListener("click", showSettings);
  document.getElementById("close-settings").addEventListener("click", hideSettings);

  // 📜 When the "History" button is clicked, open the history.html page in a new browser tab
  document.getElementById("open-history").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  });

  const settings = await loadSettings();
  document.getElementById("distance").value = settings.distance;
  document.getElementById("price").value = settings.price;

  document.getElementById("save-settings").addEventListener("click", async () => {
    const distance = parseFloat(document.getElementById("distance").value);
    const price = document.getElementById("price").value;

    chrome.storage.sync.set({ distance, price }, async () => {
      swal({
        title: `Settings saved!`,
        icon: "success",
        button: false,
      });

      hideSettings();
      await fetchRestaurants();
    });
  });
});
