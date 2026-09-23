// =================================================================================
// 🗺️ LIVE TRACKER CLASS (100% FREE - No API Keys, No Credit Card)
// =================================================================================
class LiveTracker {
    constructor() {
        this.map = null;
        this.marker = null;
        this.path = null;
        this.watchId = null;
        this.isTracking = false;

        // Grab UI elements
        this.statusEl = document.getElementById('status-text');
        this.coordsEl = document.getElementById('coords-display');
        this.toggleBtn = document.getElementById('toggle-btn');

        this.init();
    }

    // Initialize the application
    init() {
        this.setupMap();
        this.bindEvents();
    }

    // Setup the Map
    setupMap() {
        // Initialize Map (Default view: New York)
        this.map = L.map('map').setView([40.7128, -74.0060], 15);

        // Add Free OpenStreetMap Tiles (No API key required!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Create a custom "Blue Dot" icon to mimic Google Maps
        const blueDotIcon = L.divIcon({
            className: 'custom-blue-dot',
            html: `<div style="
                width: 20px; height: 20px; 
                background: #3b82f6; 
                border: 3px solid white; 
                border-radius: 50%; 
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        // Create the live location marker
        this.marker = L.marker([40.7128, -74.0060], { icon: blueDotIcon }).addTo(this.map);

        // Create the path trail
        this.path = L.polyline([], { 
            color: '#3b82f6', 
            weight: 5, 
            opacity: 0.6 
        }).addTo(this.map);
    }

    // Bind UI button clicks
    bindEvents() {
        this.toggleBtn.addEventListener('click', () => {
            if (this.isTracking) {
                this.stopTracking();
            } else {
                this.startTracking();
            }
        });
    }

    // Start the Geolocation Watcher (Browser's built-in FREE GPS)
    startTracking() {
        if (!("geolocation" in navigator)) {
            this.updateStatus("❌ Geolocation not supported.", true);
            return;
        }

        this.updateStatus("📡 Acquiring GPS signal...");
        
        // watchPosition continuously updates as you move
        this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.handleLocationSuccess(pos),
            (err) => this.handleLocationError(err),
            {
                enableHighAccuracy: true, // Uses GPS hardware if available
                timeout: 10000,           
                maximumAge: 0             
            }
        );

        this.isTracking = true;
        this.toggleBtn.textContent = "Stop Tracking";
        this.toggleBtn.className = "btn btn-stop";
    }

    // Stop the Geolocation Watcher
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        this.updateStatus("⏸️ Tracking paused.");
        this.toggleBtn.textContent = "Start Tracking";
        this.toggleBtn.className = "btn btn-start";
    }

    // Handle successful location update
    handleLocationSuccess(position) {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const latLng = [latitude, longitude]; // Leaflet uses [lat, lng] arrays

        // 1. Update Map UI
        this.marker.setLatLng(latLng);
        this.path.addLatLng(latLng);
        this.map.panTo(latLng); // Keeps you in the center

        // 2. Update Status Text
        const speedKmh = speed ? (speed * 3.6).toFixed(1) : '0.0';
        this.updateStatus(`✅ Accuracy: ${Math.round(accuracy)}m | Speed: ${speedKmh} km/h`);

        // 3. Show exact coordinates on the screen
        this.coordsEl.textContent = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    }

    // Handle location errors
    handleLocationError(error) {
        let msg = "❌ Unknown location error.";
        switch (error.code) {
            case error.PERMISSION_DENIED: 
                msg = "❌ Permission denied. Allow location in browser settings."; 
                break;
            case error.POSITION_UNAVAILABLE: 
                msg = "❌ Location unavailable."; 
                break;
            case error.TIMEOUT: 
                msg = "❌ Request timed out."; 
                break;
        }
        this.updateStatus(msg, true);
        this.stopTracking();
    }

    // Helper to update UI text
    updateStatus(message, isError = false) {
        this.statusEl.textContent = message;
        this.statusEl.style.color = isError ? '#ef4444' : '#333';
    }
}

// =================================================================================
// 🏁 INITIALIZE APP
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new LiveTracker();
});