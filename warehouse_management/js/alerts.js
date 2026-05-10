// ══════════════════════════════════════════════
// ALERT SYSTEM ENGINE — Real-time Monitoring
// ══════════════════════════════════════════════
function getAlertMethods() {
    return {
        // Main monitor called every sim tick
        monitorSystem() {
            if (!this.simRunning) return;

            // 1. Environmental Monitoring (IoT)
            this.checkEnvironmentalAlerts();

            // 2. Inventory Monitoring (Expiry & Quality)
            this.checkInventoryAlerts();

            // 3. Logistics Monitoring (ETA & Costs)
            this.checkLogisticsAlerts();
        },

        // ── 1. Environmental Alert Logic ──
        checkEnvironmentalAlerts() {
            const reading = this.currentIotReading();
            if (!reading) return;

            const zones = ['A', 'B', 'C', 'D'];
            zones.forEach(zKey => {
                const cfg = ZONE_CONFIGS[zKey];
                const r = reading['zone' + zKey];
                if (!r || !cfg) return;

                // Temperature check
                if (r.temp > cfg.maxTemp + 2) {
                    this.triggerAlert('IoT Sensor', `Nhiệt độ Zone ${zKey} quá cao: ${r.temp}°C`, 'critical', 'fas fa-temperature-high');
                } else if (r.temp > cfg.maxTemp) {
                    this.triggerAlert('IoT Sensor', `Cảnh báo nhiệt độ Zone ${zKey}: ${r.temp}°C`, 'warning', 'fas fa-temperature-half');
                }

                // Humidity check
                if (r.humidity > 92) {
                    this.triggerAlert('IoT Sensor', `Độ ẩm Zone ${zKey} vượt ngưỡng: ${r.humidity}%`, 'warning', 'fas fa-droplet');
                }

                // Vibration check (Critical for fragile items)
                if (r.vibration > 0.12) {
                    this.triggerAlert('IoT Sensor', `Rung chấn cực mạnh tại Zone ${zKey}!`, 'critical', 'fas fa-burst');
                }
            });
        },

        // ── 2. Inventory Alert Logic ──
        checkInventoryAlerts() {
            const today = this.simVirtualTime;
            
            this.inventoryList.forEach(item => {
                if (item.stock <= 0) return;

                // Expiry Check
                if (item.expiryDate) {
                    const daysLeft = this.daysUntilExpiry(item.expiryDate);
                    if (daysLeft < 0) {
                        this.triggerAlert('Hạn sử dụng', `${item.name} đã HẾT HẠN!`, 'critical', 'fas fa-calendar-times');
                    } else if (daysLeft <= 7) {
                        this.triggerAlert('Hạn sử dụng', `${item.name} sẽ hết hạn trong ${daysLeft} ngày`, 'warning', 'fas fa-calendar-day');
                    }
                }

                // Quality Check
                if (item.quality < 30) {
                    this.triggerAlert('Chất lượng', `${item.name} chất lượng quá thấp (${item.quality.toFixed(0)}%)`, 'critical', 'fas fa-biohazard');
                } else if (item.quality < 60) {
                    const existing = this.alerts.find(a => a.name === item.name && a.type === 'Chất lượng');
                    if (!existing) {
                        this.triggerAlert('Chất lượng', `${item.name} đang giảm chất lượng (${item.quality.toFixed(0)}%)`, 'warning', 'fas fa-circle-exclamation');
                    }
                }
            });
        },

        // ── 3. Logistics Alert Logic ──
        checkLogisticsAlerts() {
            const now = this.simVirtualTime;
            const s = this.simState;

            // ETA Delays
            this.shippingList.forEach(sh => {
                if (sh.status === 'Đã giao' || !sh.estimatedArrival) return;
                
                const eta = new Date(sh.estimatedArrival);
                // Trigger delay alert if virtual time passed ETA and not delivered
                if (now > eta && sh.status !== 'Đã giao') {
                    const delayHours = Math.round((now - eta) / (1000 * 3600));
                    this.triggerAlert('Logistics Delay', `Vận đơn ${sh.trackId} đang bị trễ ${delayHours}h so với ETA!`, 'critical', 'fas fa-clock-rotate-left');
                }
            });

            // Cost Anomalies (Every 12 virtual hours)
            if (s.logisticsCost > 0 && this.simTickCount % 12 === 0) {
                const avgDailyLog = s.dailyLogistics;
                const currentDailyLog = (s.logisticsCost / (this.simTickCount/24 || 1));
                
                if (currentDailyLog > avgDailyLog * 1.3) {
                    const increase = ((currentDailyLog/avgDailyLog - 1)*100).toFixed(0);
                    this.triggerAlert('Tài chính', `Cảnh báo chi phí logistics tăng bất thường (+${increase}%)`, 'warning', 'fas fa-money-bill-trend-up');
                }
            }
        },

        // ── Helper to trigger an alert ──
        triggerAlert(type, message, level, icon = 'fas fa-bell') {
            // Avoid duplicate spam (same message in last 3 ticks)
            const recent = this.alerts.slice(0, 5).find(a => a.note === message);
            if (recent) return;

            const newAlert = {
                id: 'ALRT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                name: type,
                type: type,
                level: level === 'critical' ? 'Khẩn cấp' : level === 'warning' ? 'Trung bình' : 'Thấp',
                qty: 0,
                alertDate: this.simVirtualTime.toISOString().split('T')[0],
                handling: level === 'critical' ? 'Xử lý ngay' : 'Theo dõi',
                note: message,
                icon: icon,
                timestamp: this.simVirtualTime.toISOString()
            };

            this.alerts.unshift(newAlert);
            if (this.alerts.length > 100) this.alerts.pop();

            // Show Toast
            this.toast(message, level === 'critical' ? 'error' : level === 'warning' ? 'warning' : 'info', type);

            // If critical, push to event log too
            if (level === 'critical') {
                this.simPushEvent(`<span style="color:#ef4444;font-weight:900;">🚨 ${type}:</span> ${message}`);
            }
        },

        // Get only critical active alerts for dashboard
        activeCriticalAlerts() {
            return this.alerts.filter(a => a.level === 'Khẩn cấp').slice(0, 3);
        }
    };
}
