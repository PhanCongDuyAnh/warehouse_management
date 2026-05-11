// ==========================================
// LOGISTICS & GPS MODULE
// Handle Leaflet Map & Real-time vehicle tracking
// ==========================================

let map = null;
let markers = {};
let hubMarkers = {};
let hubConnections = []; // Static lines between hubs
let polylineRoutes = {};

function getLogisticsMethods() {
    return {
        initLogisticsMap() {
            if (map) {
                setTimeout(() => map.invalidateSize(), 100);
                return;
            }

            // Center on Hanoi
            map = L.map('logistics-map').setView([21.0000, 105.8000], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add Hub Markers
            Object.keys(HUB_DATA).forEach(name => {
                const hub = HUB_DATA[name];
                const icon = L.divIcon({
                    html: `<div class="hub-marker" style="background:${hub.color}"><i class="fas ${hub.type === 'main' ? 'fa-star' : 'fa-building'}"></i></div>`,
                    className: 'custom-div-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                hubMarkers[name] = L.marker(hub.coords, { icon })
                    .addTo(map)
                    .bindPopup(`<b>${hub.name}</b><br>Trạng thái: Hoạt động`);
            });

            // Draw Hub Connections (The logical network)
            this.drawHubNetwork();

            // Start periodic update
            setInterval(() => {
                if (this.currentTab === 'logistics') {
                    this.updateMapMarkers();
                }
            }, 1000);
            
            // Immediate update
            this.updateMapMarkers();
        },

        updateMapMarkers() {
            if (!map) return;
            const activeShipments = this.shippingList.filter(s => s.status !== 'Đã giao');

            // Remove old markers
            Object.keys(markers).forEach(id => {
                if (!activeShipments.find(s => s.trackId === id)) {
                    map.removeLayer(markers[id]);
                    if (polylineRoutes[id]) map.removeLayer(polylineRoutes[id]);
                    delete markers[id];
                    delete polylineRoutes[id];
                }
            });

            activeShipments.forEach(s => {
                // If coordinates are missing, let the simulation logic handle it (but we can force it here too)
                if (!s.currentCoords) {
                    // Force initialization if missing
                    const hub = HUB_DATA[s.originHub] || HUB_DATA['Long Biên'];
                    s.originCoords = hub.coords;
                    s.currentCoords = [...hub.coords];
                    s.destCoords = s.destCoords || [21.0 + (Math.random() - 0.5) * 0.2, 105.8 + (Math.random() - 0.5) * 0.2];
                }

                const isFocused = s.trackId === this.focusedVehicleId;
                const icon = L.divIcon({
                    html: `<div class="vehicle-marker ${s.status === 'Đã nhận' ? 'delivered' : ''} ${isFocused ? 'focused' : ''}" style="border-color:${VEHICLE_CONFIGS[s.vehicleType]?.color || '#6366f1'}">
                            <i class="fas ${VEHICLE_CONFIGS[s.vehicleType]?.icon || 'fa-truck'}"></i>
                           </div>`,
                    className: 'custom-div-icon',
                    iconSize: [34, 34],
                    iconAnchor: [17, 17]
                });

                if (markers[s.trackId]) {
                    markers[s.trackId].setLatLng(s.currentCoords);
                    markers[s.trackId].setIcon(icon);
                } else {
                    markers[s.trackId] = L.marker(s.currentCoords, { icon }).addTo(map)
                        .bindPopup(`<b>${s.trackId}</b><br>Đơn: ${s.orderId}<br>Tài xế: ${s.driverName}`);
                }

                if (s.destCoords) {
                    const path = [s.currentCoords, s.destCoords];
                    if (polylineRoutes[s.trackId]) {
                        polylineRoutes[s.trackId].setLatLngs(path);
                    } else {
                        polylineRoutes[s.trackId] = L.polyline(path, {
                            color: '#6366f1',
                            weight: 2,
                            opacity: 0.5,
                            dashArray: '5, 10'
                        }).addTo(map);
                    }
                }
            });
        },

        focusVehicle(s) {
            this.focusedVehicleId = s.trackId;
            if (map && s.currentCoords) {
                map.flyTo(s.currentCoords, 15);
                if (markers[s.trackId]) markers[s.trackId].openPopup();
                this.updateMapMarkers();
            }
        },

        drawHubNetwork() {
            if (!map) return;
            
            // Define the connections (logical paths between hubs)
            const connections = [
                ['Long Biên', 'Hoài Đức'],
                ['Long Biên', 'Ngọc Hồi'],
                ['Long Biên', 'Hà Đông'],
                ['Hà Đông', 'Hoài Đức'],
                ['Hà Đông', 'Ngọc Hồi']
            ];

            // Clear old lines if any
            hubConnections.forEach(line => map.removeLayer(line));
            hubConnections = [];

            connections.forEach(([from, to]) => {
                const c1 = HUB_DATA[from]?.coords;
                const c2 = HUB_DATA[to]?.coords;
                if (c1 && c2) {
                    const line = L.polyline([c1, c2], {
                        color: '#94a3b8', // Slate 400
                        weight: 1,
                        opacity: 0.3,
                        dashArray: '1, 10'
                    }).addTo(map);
                    hubConnections.push(line);
                }
            });
        }
    };
}
