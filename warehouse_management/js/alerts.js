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
            // Avoid duplicate spam (same message in last 10 alerts)
            const recent = this.alerts.slice(0, 10).find(a => a.note === message && a.type === type);
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
        },

        // ── 4. Alert Handling & Resolution ──
        handleAlert(alert) {
            this.selectedAlert = { ...alert };
            this.showHandlingModal = true;
        },

        async resolveAlert(alert, actionId) {
            const index = this.alerts.findIndex(a => a.id === alert.id);
            if (index === -1) return;

            const action = this.getAvailableActions(alert).find(ac => ac.id === actionId);
            if (!action) return;

            // Logic based on actionId
            let resolutionMsg = "";
            let shouldRemove = action.resolve;

            switch (actionId) {
                case 'adjust_iot':
                    resolutionMsg = `Đã gửi lệnh điều chỉnh hệ thống tại Zone ${alert.note.split('Zone ')[1]?.[0] || 'A'}.`;
                    break;
                case 'check_maintenance':
                    resolutionMsg = `Đã điều động kỹ thuật kiểm tra khu vực cảnh báo.`;
                    break;
                case 'apply_discount':
                    const prodName = alert.note.split(' đã')[0] || alert.note.split(' sẽ')[0];
                    const prod = this.inventoryList.find(p => p.name === prodName);
                    if (prod) {
                        prod.currentSellPrice = Math.round(prod.baseSellPrice * 0.7);
                        resolutionMsg = `Đã áp dụng giảm giá 30% cho ${prodName}.`;
                    } else {
                        resolutionMsg = `Đã áp dụng chương trình khuyến mãi.`;
                    }
                    break;
                case 'restock':
                    resolutionMsg = `Đã tạo yêu cầu nhập hàng bổ sung.`;
                    this.currentTab = 'inventory';
                    this.showAddProduct = true;
                    break;
                case 'contact_driver':
                    resolutionMsg = `Đã liên hệ và hối thúc tài xế/đối tác vận chuyển.`;
                    break;
                case 'reroute':
                    resolutionMsg = `Đã tính toán lại lộ trình tối ưu cho vận đơn.`;
                    break;
                case 'ignore':
                    resolutionMsg = `Đã ghi nhận và tiếp tục theo dõi cảnh báo này.`;
                    break;
                case 'resolved':
                    resolutionMsg = `Cảnh báo đã được xử lý hoàn tất.`;
                    break;
                default:
                    resolutionMsg = `Đã thực hiện: ${action.label}`;
            }

            if (shouldRemove) {
                this.alerts.splice(index, 1);
                this.simPushEvent(`✅ <b>Resolved:</b> ${resolutionMsg}`);
                this.toast(resolutionMsg, 'success', 'Đã xử lý xong');
            } else {
                this.toast(resolutionMsg, 'info', 'Đang theo dõi');
            }

            this.showHandlingModal = false;
            this.persist();
        },

        getAvailableActions(alert) {
            const type = alert.type;
            const actions = [];

            if (type === 'IoT Sensor') {
                actions.push({ id: 'adjust_iot', label: 'Điều chỉnh hệ thống', icon: 'fas fa-sliders', resolve: true });
                actions.push({ id: 'check_maintenance', label: 'Bảo trì thiết bị', icon: 'fas fa-tools', resolve: true });
            } else if (type === 'Hạn sử dụng' || type === 'Chất lượng') {
                actions.push({ id: 'apply_discount', label: 'Xả hàng (Giảm giá)', icon: 'fas fa-tags', resolve: true });
                actions.push({ id: 'restock', label: 'Nhập hàng mới', icon: 'fas fa-cart-plus', resolve: true });
            } else if (type === 'Logistics Delay') {
                actions.push({ id: 'contact_driver', label: 'Liên hệ tài xế', icon: 'fas fa-phone', resolve: true });
                actions.push({ id: 'reroute', label: 'Tối ưu lộ trình', icon: 'fas fa-route', resolve: true });
            } else if (type === 'Tài chính') {
                actions.push({ id: 'check_maintenance', label: 'Kiểm toán chi phí', icon: 'fas fa-file-invoice-dollar', resolve: true });
            }

            actions.push({ id: 'resolved', label: 'Đã xử lý xong', icon: 'fas fa-check-double', resolve: true });
            actions.push({ id: 'ignore', label: 'Tiếp tục theo dõi', icon: 'fas fa-eye', resolve: false });

            return actions;
        }
    };
}
