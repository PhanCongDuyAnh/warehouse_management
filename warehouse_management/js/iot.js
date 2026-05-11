// ==========================================
// IOT MONITOR — Sensor Data & Real-time Visualization
// ==========================================
function getIotMethods() {
    return {
        // Cấu hình Zone để hiển thị
        ZONE_CONFIGS: ZONE_CONFIGS,

        initIotCharts() {
            this.$nextTick(() => {
                Object.keys(this.ZONE_CONFIGS).forEach(zone => {
                    const ctx = document.getElementById(`iot-chart-${zone}`);
                    if (!ctx) return;
                    
                    if (window[`chart_iot_${zone}`]) {
                        window[`chart_iot_${zone}`].destroy();
                    }

                    window[`chart_iot_${zone}`] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: Array(20).fill(''),
                            datasets: [{
                                label: 'Nhiệt độ',
                                data: Array(20).fill(this.iotData.zones[zone].temp),
                                borderColor: this.ZONE_CONFIGS[zone].color,
                                backgroundColor: this.ZONE_CONFIGS[zone].color + '10',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.5,
                                pointRadius: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { display: false },
                                y: { 
                                    grid: { display: false },
                                    ticks: { display: false }
                                }
                            },
                            animation: { duration: 800 }
                        }
                    });
                });
            });
        },

        updateIotRealtime() {
            if (!this.iotData || !this.iotData.zones) return;

            Object.keys(this.iotData.zones).forEach(z => {
                const config = this.ZONE_CONFIGS[z];
                const zoneData = this.iotData.zones[z];
                
                if (zoneData.isMaintenance) return;

                // Kiểm tra ngưỡng cảnh báo
                if (zoneData.temp > config.maxTemp + 2 || zoneData.temp < config.minTemp - 2) {
                    zoneData.status = 'Critical';
                } else if (zoneData.temp > config.maxTemp || zoneData.temp < config.minTemp) {
                    zoneData.status = 'Warning';
                } else {
                    zoneData.status = 'Normal';
                }

                // Cập nhật biểu đồ nếu đang ở tab IoT
                if (this.currentTab === 'iot' && window[`chart_iot_${z}`]) {
                    const chart = window[`chart_iot_${z}`];
                    chart.data.datasets[0].data.push(zoneData.temp);
                    chart.data.datasets[0].data.shift();
                    chart.update('quiet');
                }
            });
        },

        showZoneDetails(z) {
            const zone = this.iotData.zones[z];
            const cfg = this.ZONE_CONFIGS[z];
            this.selectedIotZone = { id: z, ...zone, ...cfg };
            this.showIotModal = true;
        },

        toggleMaintenance(z) {
            const zone = this.iotData.zones[z];
            zone.isMaintenance = !zone.isMaintenance;
            zone.status = zone.isMaintenance ? 'Maintenance' : 'Normal';
            this.toast(`${zone.isMaintenance ? 'Đã bật' : 'Đã tắt'} chế độ bảo trì cho Zone ${z}`, 'info');
        },

        getSensorStatusClass(status) {
            return {
                'Normal': 'bg-emerald-500',
                'Warning': 'bg-amber-500 animate-pulse',
                'Critical': 'bg-red-500 animate-ping',
                'Maintenance': 'bg-slate-400'
            }[status] || 'bg-slate-300';
        }
    };
}
