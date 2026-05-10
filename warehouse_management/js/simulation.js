// ══════════════════════════════════════════════
// SIMULATION ENGINE METHODS — Smart Warehouse
// Real-time IoT, per-item decay, logistics nâng cao
// ══════════════════════════════════════════════
function getSimulationMethods() {
    return {
        simSpeedLabel() {
            const map = { '1000': '1×', '500': '2×', '200': '5×', '100': '10×' };
            return map[this.simSpeed] || '1×';
        },

        simClockDisplay() {
            const d = this.simVirtualTime;
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const pad = n => String(n).padStart(2, '0');
            return days[d.getDay()] + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        },

        simFmt(n) {
            if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'T';
            if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
            if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K';
            return String(Math.round(n));
        },

        simTogglePlay() {
            if (this.simRunning) { this.simStop(); }
            else { this.simStart(); }
        },

        simStart() {
            this.simRunning = true;
            this.simLastEvent = '<span style="color:#34d399">▶ Mô phỏng đang chạy...</span>';
            this.simTickInterval = setInterval(() => { this.simTick(1); }, parseInt(this.simSpeed));
        },

        simStop() {
            this.simRunning = false;
            if (this.simTickInterval) { clearInterval(this.simTickInterval); this.simTickInterval = null; }
            this.simLastEvent = '<span style="color:#f59e0b">⏸ Đã tạm dừng lúc ' + this.simClockDisplay() + '</span>';
            this._persistSimState();
        },

        simApplySpeed() {
            if (this.simRunning) { this.simStop(); this.simStart(); }
        },

        simReset() {
            this.simStop();
            this.simVirtualTime = new Date(2026, 4, 8, 8, 0, 0);
            this.simTickCount = 0;
            this.simState = {
                qualityPct: 98, electricCost: 0, logisticsCost: 0,
                damagedItems: 0, profit: 0, etaModifier: 0,
                totalRevenue: 1280000000, hourlyElec: 185000,
                dailyLogistics: 4200000, qualityDecayPerDay: 0.15,
                profitMargin: 0.22, totalFuelConsumed: 0,
                fuelCost: 0, iotAlertCount: 0,
                scenario: 'normal', // normal, heatwave, storm, peak_season
            };
            this.simEventLog = [];
            this.iotAlertLog = [];
            this.iotData = generateInitialIotData();
            saveIotData(this.iotData);
            localStorage.removeItem('kho_thong_minh_pro_v1_simstate');
            this.simLastEvent = '<span style="color:#818cf8">↺ Đã reset về 2026-05-08 08:00</span>';
            this.simBroadcastUpdate();
            this.toast('Simulation Engine đã reset về điểm xuất phát', 'info', 'Reset thành công');
        },

        simAdvance(unit) {
            const hours = unit === 'hour' ? 1 : unit === 'day' ? 24 : 168;
            for (let i = 0; i < hours; i++) { this.simTick(1, true); }
            const unitLabel = unit === 'hour' ? '1 giờ' : unit === 'day' ? '1 ngày' : '1 tuần';
            this.toast(`Thời gian ảo đã tiến thêm <b>${unitLabel}</b>`, 'info', 'Nhảy thời gian');
            this._persistSimState();
        },

        // ─────────────────────────────────────────────
        // MAIN TICK — Trái tim của Simulation Engine
        // ─────────────────────────────────────────────
        simTick(hours = 1, silent = false) {
            this.simVirtualTime = new Date(this.simVirtualTime.getTime() + hours * 3600 * 1000);
            this.simTickCount += hours;

            const s = this.simState;
            const totalHours = this.simTickCount;
            const totalDays = totalHours / 24;

            // ── 1. IoT Data generation (mỗi tick/giờ)
            this._simGenerateIot(silent);

            // ── 2. Electric cost (per hour + random spike)
            const elecSpike = Math.random() < 0.05 ? (1.4 + Math.random() * 0.6) : (0.85 + Math.random() * 0.3);
            s.electricCost += Math.round(s.hourlyElec * hours * elecSpike);

            // ── 3. Logistics base cost
            s.logisticsCost += Math.round((s.dailyLogistics / 24) * hours * (0.9 + Math.random() * 0.2));

            // ── 4. Per-item quality decay (mỗi 6 giờ)
            if (totalHours % 6 === 0) {
                this._simDecayItemQuality(silent);
            }

            // ── 5. Shipping logistics simulation (mỗi 3 giờ)
            if (totalHours % 3 === 0 && this.shippingList.length > 0) {
                this._simUpdateShipping(silent);
            }

            // ── 6. Damaged items (probabilistic)
            if (totalHours > 0 && Math.random() < (0.006 * hours)) {
                s.damagedItems += 1;
                const damagedSku = this.inventoryList.length > 0
                    ? this.inventoryList[Math.floor(Math.random() * this.inventoryList.length)].name
                    : 'SKU không rõ';
                if (!silent) {
                    this.simPushEvent(`⚠️ Hàng hỏng phát sinh: <span>${damagedSku}</span>`);
                    const exists = this.alerts.find(a => a.name === damagedSku && a.type === 'Hàng hư hỏng');
                    if (!exists) {
                        this.alerts.unshift({ name: damagedSku, type: 'Hàng hư hỏng', level: 'Cao', qty: 0, alertDate: this.simVirtualTime.toISOString().split('T')[0], handling: 'Kiểm kê lại', note: 'Phát sinh tự động từ Simulation Engine' });
                    }
                }
            }

            // ── 7. ETA modifier
            s.etaModifier = Math.round(totalHours * 0.1);

            // ── 8. Profit calculation (với fuel cost)
            const revenueSim = s.totalRevenue * (1 + totalDays * 0.005 * (0.8 + Math.random() * 0.4));
            
            // Environmental Cost Impact
            const weatherCost = s.activeStorm ? 1.8 : 1.0;
            const trafficFuelExtra = s.activeTraffic ? 1.4 : 1.0;
            
            const fuelCost = s.totalFuelConsumed * 25000 * trafficFuelExtra; // 25,000 VNĐ/lít
            s.fuelCost = fuelCost;
            const totalCosts = s.electricCost + (s.logisticsCost * weatherCost) + fuelCost + (s.damagedItems * 2500000);
            s.profit = Math.round(revenueSim * s.profitMargin - totalCosts);

            // ── 9. Auto-snapshot every 24h virtual
            if (totalHours > 0 && totalHours % 24 === 0 && !silent) {
                const label = 'Auto — ' + this.simClockDisplay();
                this._autoSnapshot(label);
            }

            // ── 10. Milestone toasts
            if (!silent) {
                if (totalHours === 24) this.toast('Đã qua 1 ngày ảo — kiểm tra báo cáo tồn kho', 'info', 'Cột mốc 24h');
                if (totalHours === 168) this.toast('Đã qua 1 tuần ảo — phân tích chi phí', 'warning', 'Cột mốc 1 tuần');
                if (s.qualityPct < 70 && s.qualityPct >= 69.5) this.toast('Chất lượng trung bình kho xuống thấp!', 'warning', 'Cảnh báo chất lượng');
                if (s.damagedItems >= 10 && s.damagedItems < 11) this.toast('10+ SKU bị hư hỏng — cần kiểm tra kho ngay!', 'error', 'Cảnh báo hàng hỏng');
            }

            this.persist();
            this.simBroadcastUpdate();
        },

        // ─────────────────────────────────────────────
        // IoT Generation — Sinh dữ liệu cảm biến
        // ─────────────────────────────────────────────
        _simGenerateIot(silent) {
            const reading = generateIotReading(this.simVirtualTime.toISOString());
            const s = this.simState;
            
            // ── Tác động của kịch bản (Scenario Impact)
            let scenarioTempMod = 0;
            if (s.scenario === 'heatwave') {
                scenarioTempMod = 5 + Math.random() * 3; // Nắng nóng tăng 5-8°C
            } else if (s.scenario === 'storm') {
                scenarioTempMod = -3 - Math.random() * 2; // Bão giảm nhiệt độ
            }

            // Thêm nhiễu tùy theo thời gian (ban đêm nhiệt độ giảm)
            const hour = this.simVirtualTime.getHours();
            const nightFactor = (hour >= 22 || hour < 6) ? -0.8 : (hour >= 10 && hour < 16) ? 0.5 : 0;
            
            // Áp dụng nhiệt độ kịch bản vào các zone
            reading.zoneB.temp = +(reading.zoneB.temp + nightFactor + scenarioTempMod).toFixed(1);
            reading.zoneC.temp = +(reading.zoneC.temp + nightFactor * 0.5 + scenarioTempMod * 0.7).toFixed(1);
            reading.zoneA.temp = +(reading.zoneA.temp + scenarioTempMod * 0.2).toFixed(1); 
            reading.zoneD.temp = +(reading.zoneD.temp + scenarioTempMod * 0.1).toFixed(1); 

            this.iotData.push(reading);
            if (this.iotData.length > 48) this.iotData.shift(); // circular buffer

            // Kiểm tra IoT alerts
            const alerts = this._checkIotAlerts(reading);
            alerts.forEach(alert => {
                this.iotAlertLog.unshift({ time: this.simClockDisplay(), ...alert });
                this.simState.iotAlertCount = (this.simState.iotAlertCount || 0) + 1;
                if (!silent) {
                    this.simPushEvent(`🌡️ IoT ${alert.zone}: <span>${alert.message}</span>`);
                }
            });
            if (this.iotAlertLog.length > 30) this.iotAlertLog = this.iotAlertLog.slice(0, 30);

            saveIotData(this.iotData);

            // Update IoT chart nếu đang xem tab iot
            if (this.currentTab === 'iot') {
                this.$nextTick(() => this.updateIotCharts());
            }
        },

        _checkIotAlerts(reading) {
            const alerts = [];
            const zones = ['zoneA', 'zoneB', 'zoneC', 'zoneD'];
            const configs = { zoneA: ZONE_CONFIGS['A'], zoneB: ZONE_CONFIGS['B'], zoneC: ZONE_CONFIGS['C'], zoneD: ZONE_CONFIGS['D'] };
            const labels = { zoneA: 'Zone A', zoneB: 'Zone B', zoneC: 'Zone C', zoneD: 'Zone D' };

            zones.forEach(zone => {
                const cfg = configs[zone];
                const r = reading[zone];
                if (!r || !cfg) return;
                if (r.temp > cfg.maxTemp + 1.5) {
                    alerts.push({ zone: labels[zone], type: 'temp_high', message: `Nhiệt độ cao: ${r.temp}°C (max ${cfg.maxTemp}°C)`, level: 'critical' });
                } else if (r.temp < cfg.minTemp - 1.5) {
                    alerts.push({ zone: labels[zone], type: 'temp_low', message: `Nhiệt độ thấp: ${r.temp}°C (min ${cfg.minTemp}°C)`, level: 'warning' });
                }
                if (r.humidity > 90) {
                    alerts.push({ zone: labels[zone], type: 'humidity', message: `Độ ẩm cao: ${r.humidity}%`, level: 'warning' });
                }
                if (r.co2 > 550) {
                    alerts.push({ zone: labels[zone], type: 'co2', message: `CO₂ cao: ${r.co2}ppm`, level: 'warning' });
                }
                if (r.vibration > 0.08) {
                    alerts.push({ zone: labels[zone], type: 'vibration', message: `Rung chấn: ${r.vibration}g`, level: 'critical' });
                }
            });
            return alerts;
        },

        // ─────────────────────────────────────────────
        // Per-item Quality Decay
        // ─────────────────────────────────────────────
        _simDecayItemQuality(silent) {
            const latestIot = this.iotData.length > 0 ? this.iotData[this.iotData.length - 1] : null;
            let totalQuality = 0;
            let count = 0;
            const today = this.simVirtualTime;

            this.inventoryList.forEach(item => {
                if (item.stock <= 0) return;
                count++;

                // ── 1. Lấy nhiệt độ zone hiện tại
                let zoneTemp = 20;
                if (latestIot && item.warehouseZone) {
                    const zoneKey = 'zone' + item.warehouseZone;
                    if (latestIot[zoneKey]) zoneTemp = latestIot[zoneKey].temp;
                }

                // ── 2. Tính temperature penalty
                let tempPenalty = 0;
                if (zoneTemp > item.maxTemp) {
                    tempPenalty = (zoneTemp - item.maxTemp) * 0.08; // Tăng penalty nhiệt độ cao
                } else if (zoneTemp < item.minTemp) {
                    tempPenalty = (item.minTemp - zoneTemp) * 0.04;
                }

                // ── 3. Tính Shelf-life penalty (Sắp hết hạn)
                let expiryPenalty = 0;
                if (item.expiryDate) {
                    const expiry = new Date(item.expiryDate);
                    const daysLeft = (expiry - today) / (1000 * 3600 * 24);
                    if (daysLeft < 7) expiryPenalty = 0.5; // Giảm mạnh nếu còn dưới 1 tuần
                    else if (daysLeft < 30) expiryPenalty = 0.1;
                }

                // ── 4. Tổng Decay
                const baseDecay = (item.decayRate || 0.05) * 0.25; 
                const totalDecay = (baseDecay + tempPenalty + expiryPenalty) * (0.9 + Math.random() * 0.3);
                const oldQuality = item.quality || 100;
                item.quality = Math.max(0, parseFloat((oldQuality - totalDecay).toFixed(2)));

                // ── 5. AI Price Suggestion Logic
                if (item.baseSellPrice) {
                    let suggestedPrice = Math.round(item.baseSellPrice * Math.sqrt(item.quality / 100));
                    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
                    const daysToExpiry = expiry ? (expiry - today) / (1000 * 3600 * 24) : 999;
                    
                    if (item.quality < 60 || daysToExpiry < 15) {
                        const pushDiscount = item.quality < 40 ? 0.4 : 0.7; 
                        suggestedPrice = Math.min(suggestedPrice, Math.round(item.baseSellPrice * pushDiscount));
                        
                        if (!silent && oldQuality >= 60 && item.quality < 60) {
                            this.simPushEvent(`🤖 AI Đề xuất: <span>${item.name}</span> giảm giá mạnh để xả kho (Chất lượng: ${item.quality.toFixed(0)}%)`);
                        }
                    }
                    item.currentSellPrice = suggestedPrice;
                }

                // ── 6. Kiểm tra ngưỡng quality & cảnh báo nguy hiểm
                if (!silent) {
                    if (item.quality < 30 && oldQuality >= 30) {
                        this.simPushEvent(`🚨 NGUY HIỂM: <span>${item.name}</span> chất lượng cực thấp!`);
                        const exists = this.alerts.find(a => a.name === item.name && a.type === 'Nguy cơ hư hỏng');
                        if (!exists) {
                            this.alerts.unshift({ 
                                name: item.name, type: 'Nguy cơ hư hỏng', level: 'Khẩn cấp', 
                                qty: item.stock, alertDate: this.simVirtualTime.toISOString().split('T')[0], 
                                handling: 'Tiêu hủy / Thanh lý gấp', 
                                note: `Chất lượng ${item.quality.toFixed(0)}% do ${zoneTemp > item.maxTemp ? 'nhiệt độ vượt ngưỡng' : 'lưu kho quá lâu'}` 
                            });
                        }
                    }
                }

                // ── 7. Tiêu hủy hàng nếu quality = 0
                if (item.quality <= 0 && item.stock > 0) {
                    const drain = Math.ceil(item.stock * 0.15); 
                    item.stock -= drain;
                    item.status = item.stock <= 0 ? 'Hết hàng' : 'Sắp hết hàng';
                    if (!silent && drain > 0) {
                        this.simPushEvent(`💀 Tiêu hủy: <span>${item.name}</span> −${drain} đv do hỏng hoàn toàn`);
                    }
                }

                totalQuality += item.quality;
            });

            this.simState.qualityPct = count > 0 ? parseFloat((totalQuality / count).toFixed(1)) : 98;
        },

        // ─────────────────────────────────────────────
        // Shipping Simulation Nâng Cao
        // ─────────────────────────────────────────────
        _simUpdateShipping(silent) {
            const statusFlow = ['Khởi tạo', 'Chuẩn bị hàng', 'Xuất kho', 'Đang vận chuyển', 'Gần tới nơi', 'Đã giao'];
            const sState = this.simState;

            this.shippingList.forEach(sh => {
                if (sh.status === 'Đã giao') return;

                const vehicleCfg = VEHICLE_CONFIGS[sh.vehicleType] || VEHICLE_CONFIGS['Xe tải 1.5T'];
                
                // 1. Initialize GPS data if missing
                if (!sh.originCoords) {
                    const hub = HUB_DATA[sh.originHub] || HUB_DATA['Long Biên'];
                    sh.originHub = hub.name.replace('Hub ', '').replace(' (Main)', '');
                    sh.originCoords = hub.coords;
                    // Random destination in Hanoi area if not set
                    sh.destCoords = [
                        21.0 + (Math.random() - 0.5) * 0.2,
                        105.8 + (Math.random() - 0.5) * 0.2
                    ];
                    sh.progress = 0;
                    sh.currentCoords = [...sh.originCoords];
                }

                // 2. Calculate movement
                if (sh.shippingStatus === 'Đang vận chuyển' || sh.shippingStatus === 'Gần tới nơi') {
                    // Impact of weather and traffic
                    const speedFactor = 1 / (sState.weatherFactor * sState.trafficFactor);
                    const actualSpeed = vehicleCfg.avgSpeedKmh * speedFactor;
                    
                    // We assume simulation tick happens every 1-3 hours virtually
                    // Let's assume this method is called every 3 virtual hours (as per simTick logic)
                    const virtualHoursElapsed = 3; 
                    const kmThisTick = actualSpeed * virtualHoursElapsed;
                    
                    sh.distance = parseFloat(((sh.distance || 0) + kmThisTick).toFixed(1));
                    
                    // Fuel impact
                    const fuelBase = kmThisTick * vehicleCfg.fuelPerKm;
                    const fuelTrafficMod = sState.activeTraffic ? 1.4 : 1.0;
                    const fuelThisTick = fuelBase * fuelTrafficMod;
                    
                    sh.fuelConsumed = parseFloat(((sh.fuelConsumed || 0) + fuelThisTick).toFixed(2));
                    sState.totalFuelConsumed = parseFloat(((sState.totalFuelConsumed || 0) + fuelThisTick).toFixed(2));

                    // Update Progress (estimated total trip 15-30km for Hanoi)
                    const totalTripEst = 25; 
                    sh.progress = Math.min(99, (sh.progress || 0) + (kmThisTick / totalTripEst) * 100);
                    
                    // Interpolate Coordinates
                    const p = sh.progress / 100;
                    sh.currentCoords = [
                        sh.originCoords[0] + (sh.destCoords[0] - sh.originCoords[0]) * p,
                        sh.originCoords[1] + (sh.destCoords[1] - sh.originCoords[1]) * p
                    ];

                    if (sh.progress > 85) sh.shippingStatus = 'Gần tới nơi';
                }

                // 3. Status Transitions
                const r = Math.random();
                const curIdx = statusFlow.indexOf(sh.shippingStatus);

                if (curIdx < statusFlow.length - 1) {
                    // Faster transition if speed is normal
                    const transitionProb = 0.2 * (1 / (sState.weatherFactor * sState.trafficFactor));
                    if (r < transitionProb) {
                        sh.shippingStatus = statusFlow[curIdx + 1];
                        sh.status = sh.shippingStatus === 'Đã giao' ? 'Đã giao' : (sh.shippingStatus === 'Đang vận chuyển' || sh.shippingStatus === 'Gần tới nơi') ? 'Đang đi' : 'Đang chuẩn bị';
                        sh.location = this._simLocationForStatus(sh.shippingStatus, sh.destination);

                        if (sh.shippingStatus === 'Đã giao') {
                            sh.progress = 100;
                            sh.currentCoords = [...sh.destCoords];
                            const ord = this.orders.find(o => o.id === sh.orderId);
                            if (ord) ord.status = 'Đã nhận';
                            if (!silent) this.simPushEvent(`✅ Giao hàng <span>${sh.trackId}</span> thành công!`);
                        } else if (!silent) {
                            this.simPushEvent(`🚚 <span>${sh.trackId}</span>: ${sh.shippingStatus}`);
                        }
                    }
                }

                // 4. Incident alerts
                if (r > 0.98 && !silent && sh.status === 'Đang đi') {
                    const event = sState.activeStorm ? 'Ảnh hưởng bão: Xe phải dừng trú' : 
                                  sState.activeTraffic ? 'Ùn tắc nghiêm trọng: Xe nhích từng chút' :
                                  this._simDelayReason();
                    this.simPushEvent(`⚠️ <span>${sh.trackId}</span>: ${event}`);
                }
            });
        },

        _simLocationForStatus(status, destination) {
            const map = {
                'Khởi tạo': 'Kho tổng HN',
                'Chuẩn bị hàng': 'Kho tổng HN — Khu xuất',
                'Xuất kho': 'Bãi xe kho HN',
                'Đang vận chuyển': this._simRandomLocation(),
                'Gần tới nơi': `Gần ${destination || 'địa chỉ giao'}`,
                'Đã giao': destination || 'Địa chỉ người nhận'
            };
            return map[status] || 'Đang vận chuyển';
        },

        _simDelayReason() {
            const reasons = ['Kẹt xe trên QL1A', 'Thời tiết xấu', 'Nghỉ trạm dừng', 'Kiểm tra hàng hóa', 'Đèn đỏ liên tiếp'];
            return reasons[Math.floor(Math.random() * reasons.length)];
        },

        // ─────────────────────────────────────────────
        // Auto Snapshot
        // ─────────────────────────────────────────────
        _autoSnapshot(label) {
            if (!this.snapshots) this.snapshots = [];
            // Xóa auto-snapshot cũ nếu > 5
            const autoSnaps = this.snapshots.filter(s => s.label.startsWith('Auto'));
            if (autoSnaps.length >= 5) {
                const oldest = autoSnaps[autoSnaps.length - 1];
                this.snapshots = this.snapshots.filter(s => s.id !== oldest.id);
            }
            const snap = {
                id: 'snap-' + Date.now(),
                label,
                time: this.simVirtualTime.toISOString(),
                simTickCount: this.simTickCount,
                data: JSON.parse(JSON.stringify({
                    inventoryList: this.inventoryList,
                    shippingList: this.shippingList,
                    orders: this.orders,
                    alerts: this.alerts,
                    simState: this.simState
                }))
            };
            this.snapshots.unshift(snap);
            if (this.snapshots.length > 10) this.snapshots = this.snapshots.slice(0, 10);
            saveSnapshots(this.snapshots);
        },

        // ─────────────────────────────────────────────
        // Persist sim state to localStorage
        // ─────────────────────────────────────────────
        _persistSimState() {
            saveSimSnapshot({
                tickCount: this.simTickCount,
                virtualTime: this.simVirtualTime.toISOString(),
                simState: this.simState,
            });
        },

        // ─────────────────────────────────────────────
        // Broadcast & Update
        // ─────────────────────────────────────────────
        simBroadcastUpdate() {
            if (this.currentTab === 'reports') {
                this.$nextTick(() => this.refreshReports());
            }
            const bar = document.getElementById('sim-engine-bar');
            if (bar) bar.querySelectorAll('.sim-metric-val').forEach(el => {
                el.classList.remove('sim-updated');
                void el.offsetWidth;
                el.classList.add('sim-updated');
            });
        },

        simPushEvent(html) {
            this.simLastEvent = html;
            this.simEventLog.unshift({ time: this.simClockDisplay(), html });
            if (this.simEventLog.length > 60) this.simEventLog.pop();
        },

        _simRandomLocation() {
            const locs = ['Kho tổng HN', 'Bưu cục Q.1', 'Bưu cục Q.7', 'Trung chuyển SG', 'Đang vận chuyển QL1A', 'Gần tới nơi', 'Kho HCM', 'Bưu cục Bình Thạnh', 'Ngã tư Hàng Xanh', 'Cầu Đồng Nai'];
            return locs[Math.floor(Math.random() * locs.length)];
        },

        // ─────────────────────────────────────────────
        // IoT Current Reading Helper
        // ─────────────────────────────────────────────
        currentIotReading() {
            if (!this.iotData || this.iotData.length === 0) return null;
            return this.iotData[this.iotData.length - 1];
        },

        currentZoneReading(zone) {
            const r = this.currentIotReading();
            if (!r) return { temp: 0, humidity: 0, co2: 0, vibration: 0 };
            const key = 'zone' + zone;
            return r[key] || { temp: 0, humidity: 0, co2: 0, vibration: 0 };
        },

        iotZoneStatusClass(zone) {
            const cfg = ZONE_CONFIGS[zone];
            if (!cfg) return 'iot-normal';
            const r = this.currentZoneReading(zone);
            if (r.temp > cfg.maxTemp + 1.5 || r.temp < cfg.minTemp - 1.5 || r.vibration > 0.08) return 'iot-critical';
            if (r.temp > cfg.maxTemp || r.temp < cfg.minTemp || r.humidity > 85 || r.co2 > 500) return 'iot-warning';
            return 'iot-normal';
        },

        iotZoneStatusLabel(zone) {
            const cls = this.iotZoneStatusClass(zone);
            if (cls === 'iot-critical') return 'Nguy hiểm';
            if (cls === 'iot-warning') return 'Cảnh báo';
            return 'Bình thường';
        },

        // ─────────────────────────────────────────────
        // Inventory Helpers
        // ─────────────────────────────────────────────
        avgInventoryQuality() {
            if (!this.inventoryList || this.inventoryList.length === 0) return 100;
            const total = this.inventoryList.reduce((sum, item) => sum + (item.quality || 100), 0);
            return parseFloat((total / this.inventoryList.length).toFixed(1));
        },

        totalFuelDisplay() {
            const f = this.simState.totalFuelConsumed || 0;
            return f.toFixed(1) + ' L';
        },

        // ─────────────────────────────────────────────
        // Control Center Helpers
        // ─────────────────────────────────────────────
        systemStatus() {
            const s = this.simState;
            const alerts = this.alerts.length;
            const damaged = s.damagedItems;
            const quality = s.qualityPct;
            
            if (damaged > 10 || quality < 50 || this.iotAlertLog.some(a => a.level === 'critical')) {
                return { label: 'Danger', class: 'status-danger', icon: 'fa-exclamation-triangle', msg: 'Hệ thống đang gặp sự cố nghiêm trọng!' };
            }
            if (damaged > 3 || quality < 80 || alerts > 5 || this.iotAlertLog.length > 0) {
                return { label: 'Warning', class: 'status-warning', icon: 'fa-exclamation-circle', msg: 'Phát hiện rủi ro vận hành.' };
            }
            return { label: 'Stable', class: 'status-stable', icon: 'fa-check-circle', msg: 'Hệ thống hoạt động ổn định.' };
        },

        getWeather(city) {
            // Giả lập thời tiết dựa trên virtual time
            const hour = this.simVirtualTime.getHours();
            const isNight = hour >= 19 || hour <= 5;
            const scenario = this.simState.scenario;
            
            let temp = city === 'Hanoi' ? 28 : city === 'Danang' ? 30 : 32;
            if (isNight) temp -= 5;
            if (scenario === 'heatwave') temp += 8;
            if (scenario === 'storm') temp -= 4;

            const icons = {
                normal: isNight ? 'fa-moon' : 'fa-sun',
                heatwave: 'fa-temperature-high',
                storm: 'fa-cloud-showers-heavy',
                peak_season: 'fa-cloud'
            };

            return { temp, icon: icons[scenario] || icons.normal };
        },

        aiRiskAlerts() {
            const risks = [];
            
            // 1. Spoilage risk
            this.inventoryList.slice(0, 20).forEach(item => {
                if (item.quality < 60 && item.stock > 0) {
                    risks.push({ title: item.name, desc: `Chất lượng thấp (${item.quality}%)`, type: 'high', icon: 'fa-biohazard' });
                }
            });

            // 2. Delivery delay risk
            this.shippingList.forEach(sh => {
                if (sh.status === 'Đang đi' && Math.random() > 0.8) {
                    risks.push({ title: sh.trackId, desc: `Vận chuyển bị chậm tại ${sh.location}`, type: 'mid', icon: 'fa-clock' });
                }
            });

            // 3. IoT Anomalies
            const latestIot = this.currentIotReading();
            if (latestIot) {
                if (latestIot.zoneA.temp > 8) risks.push({ title: 'Zone A', desc: 'Nhiệt độ vượt ngưỡng bảo quản!', type: 'high', icon: 'fa-thermometer-half' });
                if (latestIot.zoneB.vibration > 0.05) risks.push({ title: 'Zone B', desc: 'Rung chấn bất thường', type: 'mid', icon: 'fa-wave-square' });
            }

            return risks.slice(0, 5);
        }
    };
}
