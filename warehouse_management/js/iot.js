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
                    
                    // Xóa biểu đồ cũ nếu có
                    if (window[`chart_iot_${zone}`]) {
                        window[`chart_iot_${zone}`].destroy();
                    }

                    window[`chart_iot_${zone}`] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: Array(10).fill(''),
                            datasets: [{
                                label: 'Temperature',
                                data: Array(10).fill(this.ZONE_CONFIGS[zone].baseTemp),
                                borderColor: this.ZONE_CONFIGS[zone].color,
                                backgroundColor: this.ZONE_CONFIGS[zone].color + '20',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
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
                            }
                        }
                    });
                });
            });
        },

        updateIotRealtime() {
            Object.keys(this.iotData.zones).forEach(z => {
                const config = this.ZONE_CONFIGS[z];
                const zoneData = this.iotData.zones[z];
                
                // Giả lập biến động nhẹ
                zoneData.temp += (Math.random() - 0.5) * 0.1;
                zoneData.humi += (Math.random() - 0.5) * 0.5;
                zoneData.vibration = Math.random() * 0.05;

                // Kiểm tra ngưỡng
                if (zoneData.temp > config.maxTemp || zoneData.temp < config.minTemp) {
                    zoneData.status = 'Warning';
                } else {
                    zoneData.status = 'Normal';
                }

                // Cập nhật Chart
                if (window[`chart_iot_${z}`]) {
                    const chart = window[`chart_iot_${z}`];
                    chart.data.datasets[0].data.push(zoneData.temp);
                    chart.data.datasets[0].data.shift();
                    chart.update('none');
                }
            });
            saveIotData(this.iotData);
        },

        getSensorStatusClass(status) {
            return {
                'Normal': 'bg-emerald-500',
                'Warning': 'bg-orange-500 animate-pulse',
                'Critical': 'bg-red-500 animate-ping'
            }[status] || 'bg-slate-300';
        }
    };
}
