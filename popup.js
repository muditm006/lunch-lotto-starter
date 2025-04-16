const apiKey = "AIzaSyACKFjtEFbq_Joo-NPi1eMtlMMh1UyFLW8";

// 🗂️ Initialize an empty array to store the lunch history entries
let history = [];

// ⚙️ Default user settings for restaurant search
const defaultSettings = {
  distance: 0.5,
  price: "2,3",
  dietary: "",
};

// 📏 Helper function to convert miles to meters (required for Google API)
function milesToMeters(miles) {
  return miles * 1609.34;
}

// 🔄 Load settings from Chrome storage (or fallback to default)
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (settings) => {
      resolve(settings);
    });
  });
}

// 🚦 Show the progress bar and hide the wheel/spin button while loading
function showProgress() {
  document.getElementById("progress-container").style.display = "block";
  document.getElementById("wheel").style.display = "none";
  document.getElementById("spin").style.display = "none";
  updateProgress(0); // Start from 0%
}

// ✅ Hide the progress bar and show the wheel/spin button again
function hideProgress() {
  document.getElementById("progress-container").style.display = "none";
  document.getElementById("wheel").style.display = "block";
  document.getElementById("spin").style.display = "block";
}

// 📊 Update the progress bar's visual width and accompanying text
function updateProgress(percent) {
  const progressBar = document.querySelector('#progress-bar');
  progressBar.style.width = `${percent}%`; // Visually update bar width
  document.getElementById("progress-text").textContent = 
    percent < 100 ? `Fetching restaurants... ${percent}%` : "Processing results...";
}

// 📡 Core function to fetch nearby restaurants and animate loading progress
async function fetchRestaurants() {
  try {
    showProgress(); // Show progress UI when starting

    // 🌍 Get user's geolocation
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      const settings = await loadSettings(); // Get saved or default settings

      updateProgress(10); // Progress after geolocation

      // 🗺️ Construct the Google Maps Places API URL
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${milesToMeters(settings.distance)}&type=restaurant&keyword=healthy&minprice=${settings.price[0]}&maxprice=${settings.price[2]}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      let currentProgress = 10;

      updateProgress(currentProgress); // Update after fetching

      // 🎞️ Simulate progress bar animation while we process data
      const simulateLoading = new Promise((resolve) => {
        const interval = setInterval(() => {
          if (currentProgress < 90) {
            currentProgress += 2;
            updateProgress(currentProgress); // Increase gradually
          } else {
            clearInterval(interval);
            resolve(); // Stop when 90% is reached
          }
        }, 100); // Every 100ms
      });

      await simulateLoading;

      if (!data.results || data.results.length === 0) {
        console.error("❌ No restaurants found!");
        hideProgress(); // Hide progress if we error out
        alert("No restaurants found! Try adjusting your settings.");
        return;
      }

      updateProgress(90); // Almost done!

      // 🧹 Map the restaurant data into a more readable structure
      let restaurants = data.results.map((place) => ({
        name: place.name,
        distance: (settings.distance).toFixed(1),
        price: place.price_level ? "$".repeat(place.price_level) : "Unknown",
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        placeId: place.place_id,
        googleMapsLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      }));

      updateProgress(95); // Final data processing

      // 🔁 Remove duplicates
      const seen = new Set();
      restaurants = restaurants.filter((restaurant) => {
        if (seen.has(restaurant.name)) return false;
        seen.add(restaurant.name);
        return true;
      });

      console.log("✅ Unique Restaurants fetched:", restaurants);

      // 🗃️ Create a dictionary of restaurant details for later access
      restaurantDetails = restaurants.reduce((acc, r) => {
        acc[r.name] = r;
        return acc;
      }, {});

      updateProgress(100); // Done!

      // ⏳ Delay a moment for smooth UX
      setTimeout(() => {
        hideProgress(); // Hide progress bar
        updateWheel(restaurants); // Load results into wheel
      }, 1000); // 1-second dramatic pause
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

// 🎡 Fill the spin wheel with restaurant options
function updateWheel(restaurants) {
  options.length = 0;

  const shuffledRestaurants = [...restaurants].sort(() => Math.random() - 0.5);
  const selectedRestaurants = shuffledRestaurants.slice(0, 8); // Pick top 8

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

// ⚙️ Show/hide settings panel
function showSettings() {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("settings-view").style.display = "block";
}

function hideSettings() {
  document.getElementById("main-view").style.display = "block";
  document.getElementById("settings-view").style.display = "none";
}

// 🚀 Main initialization when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  await fetchRestaurants();

  // 🎯 Set up UI event handlers
  document.getElementById("spin").addEventListener("click", () => spin());
  document.getElementById("open-settings").addEventListener("click", showSettings);
  document.getElementById("close-settings").addEventListener("click", hideSettings);

  // 📜 Open lunch history page in new tab
  document.getElementById("open-history").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  });

  // 🧩 Populate settings fields with saved values
  const settings = await loadSettings();
  document.getElementById("distance").value = settings.distance;
  document.getElementById("price").value = settings.price;

  // 💾 Save user settings and refetch restaurants
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
      await fetchRestaurants(); // Re-run with updated settings
    });
  });
});
