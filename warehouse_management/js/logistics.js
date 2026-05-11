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
                // Tăng delay để đảm bảo Alpine.js đã render xong DOM
                setTimeout(() => {
                    map.invalidateSize();
                    window.dispatchEvent(new Event('resize'));
                }, 500);
                return;
            }

            // Đảm bảo container tồn tại trước khi khởi tạo
            const container = document.getElementById('logistics-map');
            if (!container) return;

            // Center on Hanoi
            map = L.map('logistics-map').setView([21.0000, 105.8000], 12);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Add Hub Markers
            Object.keys(HUB_DATA).forEach(name => {
                const hub = HUB_DATA[name];
                const icon = L.divIcon({
                    html: `<div class="hub-marker-new" style="background:${hub.color}">
                            <div class="hub-inner">
                                <i class="fas ${hub.type === 'main' ? 'fa-warehouse' : 'fa-house-chimney-window'}"></i>
                            </div>
                           </div>`,
                    className: 'custom-div-icon',
                    iconSize: [40, 45],
                    iconAnchor: [20, 40]
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
                const vCfg = VEHICLE_CONFIGS[s.vehicleType] || VEHICLE_CONFIGS['Xe tải 1.5T'];
                const isFocused = s.trackId === this.focusedVehicleId;
                
                // Cấu trúc ký hiệu xe mới: Có hướng mũi tên và icon đặc thù
                const icon = L.divIcon({
                    html: `<div class="vehicle-marker-new ${isFocused ? 'focused' : ''}" style="background:${vCfg.color || '#6366f1'}">
                            <i class="${vCfg.icon}"></i>
                            ${s.vehicleType.includes('đông lạnh') ? '<div class="ice-badge"><i class="fas fa-snowflake"></i></div>' : ''}
                           </div>`,
                    className: 'custom-div-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                if (markers[s.trackId]) {
                    markers[s.trackId].setLatLng(s.currentCoords);
                    markers[s.trackId].setIcon(icon);
                } else {
                    markers[s.trackId] = L.marker(s.currentCoords, { icon }).addTo(map)
                        .bindPopup(`<b>${s.trackId}</b><br>Loại: ${s.vehicleType}<br>Tài xế: ${s.driverName}`);
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

        focusHub(name) {
            const hub = HUB_DATA[name];
            if (map && hub) {
                map.flyTo(hub.coords, 15, {
                    animate: true,
                    duration: 1.5
                });
                if (hubMarkers[name]) {
                    hubMarkers[name].openPopup();
                }
                this.toast(`Đang định vị Hub: ${hub.name}`, 'info', 'Hub Navigation');
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
