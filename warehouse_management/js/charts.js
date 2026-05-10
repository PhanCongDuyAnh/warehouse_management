// ==========================================
// CHART.JS — Khởi tạo và quản lý biểu đồ
// ==========================================
function getChartMethods() {
    return {
        // Tiện ích dao động ngẫu nhiên
        rnd(base, pct) { return +(base * (1 + (Math.random() - 0.5) * pct * 2)).toFixed(1); },
        rndArr(base, len, pct) { return Array.from({ length: len }, () => this.rnd(base, pct)); },
        destroyChart(id) { if (this._charts[id]) { this._charts[id].destroy(); delete this._charts[id]; } },

        // Sinh nhãn theo kỳ
        getLabels() {
            const p = this.reportPeriod;
            if (p === 'Ngày') return ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
            if (p === 'Tuần') return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            if (p === 'Tháng') return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            if (p === 'Quý') return ['Q1', 'Q2', 'Q3', 'Q4'];
            return ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
        },

        getBaseRevenue() {
            const p = this.reportPeriod;
            if (p === 'Ngày') return [20, 15, 8, 5, 12, 40, 85, 130, 110, 95, 70, 45];
            if (p === 'Tuần') return [420, 510, 390, 600, 720, 830, 460];
            if (p === 'Tháng') return [450, 520, 380, 610, 700, 850, 790, 920, 870, 1050, 1100, 1280];
            if (p === 'Quý') return [1350, 2100, 2760, 3430];
            return [3200, 5800, 7400, 8900, 10500, 12800, 14200];
        },

        refreshReports() {
            this.$nextTick(() => this.initCharts('reports'));
        },

        initCharts(tab) {
            if (tab === 'home') {
                this.destroyChart('mainRevenue'); this.destroyChart('mainInventory');
                const ctx1 = document.getElementById('mainRevenueChart')?.getContext('2d');
                if (ctx1) this._charts['mainRevenue'] = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                        datasets: [
                            { label: 'Nhập', data: this.rndArr(150, 7, 0.35), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, tension: 0.4, pointRadius: 4 },
                            { label: 'Xuất', data: this.rndArr(180, 7, 0.35), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true, tension: 0.4, pointRadius: 4 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
                });
                const ctx2 = document.getElementById('mainInventoryChart')?.getContext('2d');
                const done = this.orders.filter(o => o.status === 'Đã nhận').length || 12;
                const ship = this.orders.filter(o => o.status === 'Đang giao').length || 5;
                const wait = this.orders.filter(o => o.status === 'Chờ xử lý').length || 3;
                if (ctx2) this._charts['mainInventory'] = new Chart(ctx2, {
                    type: 'doughnut',
                    data: { labels: ['Đã nhận', 'Đang giao', 'Chờ xử lý'], datasets: [{ data: [done, ship, wait], backgroundColor: ['#10b981', '#6366f1', '#f59e0b'], borderWidth: 0, hoverOffset: 8 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } } }
                });
            }

            if (tab === 'reports') {
                // --- Cập nhật KPI từ Simulation Engine ---
                const s = this.simState;
                const finance = this.getFinancialMetrics();
                
                const fmt = (v) => v >= 1e9 ? (v / 1e9).toFixed(2) + 'T đ' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'Tr đ' : v.toLocaleString('vi-VN') + ' đ';
                
                this.statsKpi = {
                    revenue: fmt(finance.revenue), 
                    revenueUp: s.scenario === 'peak_season', 
                    revenueDelta: (s.scenario === 'peak_season' ? '+15.4%' : '-2.1%'),
                    profit: fmt(finance.netProfit), 
                    profitUp: finance.netProfit > 200000000, 
                    profitDelta: finance.riskLevel === 'High' ? '⚠️ High Risk' : 'Normal',
                    otd: (94 * (1/s.weatherFactor)).toFixed(1), 
                    error: (0.24 * s.trafficFactor).toFixed(2),
                    warehouse: Math.round(this.totalWarehouseUsed())
                };
                
                this.detailedKpis = [
                    { label: 'Đơn/Ngày', sub: 'Tốc độ đơn', value: this.rnd(42 * s.trafficFactor, 0.1).toFixed(1), delta: s.activeTraffic ? '+22%' : '0%', up: s.activeTraffic, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'fas fa-shopping-cart', iconBg: 'bg-indigo-500' },
                    { label: 'Năng lượng', sub: 'Chi phí điện', value: fmt(finance.electricityCost), delta: s.scenario === 'heatwave' ? '+50%' : 'Normal', up: s.scenario === 'heatwave', color: 'text-amber-600', bg: 'bg-amber-50', icon: 'fas fa-bolt', iconBg: 'bg-amber-500' },
                    { label: 'Vòng quay', sub: 'Lần/kỳ', value: this.rnd(4.2 / s.weatherFactor, 0.1).toFixed(1) + 'x', delta: s.activeStorm ? '-35%' : 'Stable', up: !s.activeStorm, color: 'text-green-600', bg: 'bg-green-50', icon: 'fas fa-boxes-stacked', iconBg: 'bg-green-500' },
                    { label: 'Nhiên liệu', sub: 'Lít tiêu thụ', value: s.totalFuelConsumed.toFixed(1) + 'L', delta: s.activeTraffic ? '+40%' : 'Stable', up: s.activeTraffic, color: 'text-purple-600', bg: 'bg-purple-50', icon: 'fas fa-gas-pump', iconBg: 'bg-purple-500' },
                    { label: 'Chất lượng', sub: 'Bảo quản', value: s.qualityPct.toFixed(1) + '%', delta: s.qualityPct < 80 ? '📉 Low' : '✅ Good', up: s.qualityPct >= 80, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fas fa-shield-halved', iconBg: 'bg-emerald-500' },
                ];

                const labels = this.getLabels();
                const baseArr = this.getBaseRevenue();
                
                // Adjust data based on scenario
                const scenMod = s.scenario === 'peak_season' ? 1.25 : s.scenario === 'storm' ? 0.75 : 1.0;
                const revenueData = baseArr.map(v => this.rnd(v * scenMod, 0.1));
                const profitData = revenueData.map(v => +(v * (finance.margin/100)).toFixed(1));
                
                const forecastLen = Math.ceil(labels.length / 3);
                const futureLabels = labels.slice(-forecastLen).map(l => l + '*');
                const lastRev = revenueData[revenueData.length - 1];
                
                // Scenario-based forecasting
                const forecastGrowth = s.scenario === 'peak_season' ? 1.15 : s.scenario === 'storm' ? 0.85 : 1.05;
                const forecastBase = Array.from({ length: forecastLen }, (_, i) => +(lastRev * Math.pow(forecastGrowth, i + 1)).toFixed(1));

                // 1. Chart: Revenue Main
                this.destroyChart('revMain');
                const c1 = document.getElementById('revenueMainChart')?.getContext('2d');
                if (c1) this._charts['revMain'] = new Chart(c1, {
                    type: 'bar',
                    data: {
                        labels: [...labels.slice(0, -forecastLen), ...futureLabels],
                        datasets: [
                            { label: 'Doanh thu', data: [...revenueData.slice(0, -forecastLen), ...Array(forecastLen).fill(null)], backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6, order: 2 },
                            { label: 'Lợi nhuận', data: [...profitData.slice(0, -forecastLen), ...Array(forecastLen).fill(null)], backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6, order: 2 },
                            { label: 'Dự báo DT', data: [...Array(labels.length - forecastLen).fill(null), ...forecastBase], type: 'line', borderColor: '#f59e0b', borderDash: [5, 5], pointRadius: 5, tension: 0.4, order: 1, fill: false }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 9 } } } }, scales: { y: { beginAtZero: true } } }
                });

                // 2. Chart: Profit Heatmap
                this.destroyChart('profitHeatmap');
                const c2 = document.getElementById('profitHeatmapChart')?.getContext('2d');
                if (c2) {
                    const hLabels = Object.keys(finance.profitHeatmap).length ? Object.keys(finance.profitHeatmap) : ['HN', 'HCM', 'DN', 'HP'];
                    const hData = hLabels.map(l => finance.profitHeatmap[l]?.profit || this.rnd(5000000, 0.5));
                    this._charts['profitHeatmap'] = new Chart(c2, {
                        type: 'bar',
                        data: {
                            labels: hLabels,
                            datasets: [{
                                label: 'Lợi nhuận (₫)',
                                data: hData,
                                backgroundColor: hData.map(v => v >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
                                borderRadius: 10
                            }]
                        },
                        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                    });
                }

                // 3. Chart: Finance Breakdown
                this.destroyChart('finBreakdown');
                const c3 = document.getElementById('financeBreakdownChart')?.getContext('2d');
                if (c3) this._charts['finBreakdown'] = new Chart(c3, {
                    type: 'doughnut',
                    data: {
                        labels: ['Giá vốn', 'Lương', 'Năng lượng', 'Vận chuyển', 'Tổn thất'],
                        datasets: [{
                            data: [finance.cogs, finance.salaryCost, finance.electricityCost, finance.fuelCost, finance.lossCost],
                            backgroundColor: ['#6366f1', '#a855f7', '#f59e0b', '#ef4444', '#64748b'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 8, weight: 'bold' } } } } }
                });

                // 4. Chart: Inventory Forecast
                this.destroyChart('invForecast');
                const c4 = document.getElementById('inventoryForecastChart')?.getContext('2d');
                if (c4) {
                    const invBase = Array.from({ length: labels.length }, (_, i) => this.rnd(200 + i * 8, 0.12));
                    this._charts['invForecast'] = new Chart(c4, {
                        type: 'line',
                        data: { labels, datasets: [{ label: 'Tồn kho dự báo', data: invBase, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }
                    });
                }

                // 5. Chart: Order Velocity
                this.destroyChart('ordVel');
                const c5 = document.getElementById('orderVelocityChart')?.getContext('2d');
                if (c5) this._charts['ordVel'] = new Chart(c5, {
                    type: 'bar',
                    data: { labels, datasets: [{ label: 'Đơn/ngày', data: labels.map(() => this.rnd(42, 0.2)), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 5 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });

                // 6. Chart: In/Out
                this.destroyChart('inOut');
                const c6 = document.getElementById('inOutChart')?.getContext('2d');
                if (c6) this._charts['inOut'] = new Chart(c6, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Nhập', data: baseArr.map(v => this.rnd(v * 0.7, 0.2)), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 5 },
                            { label: 'Xuất', data: baseArr.map(v => this.rnd(v * 0.85, 0.2)), backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 5 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9, weight: 'bold' } } } } }
                });

                // Auto-refresh logic
                clearInterval(this._reportInterval);
                this._reportInterval = setInterval(() => {
                    if (this.currentTab === 'reports') this.refreshReports();
                }, 10000);
            } else {
                clearInterval(this._reportInterval);
            }
        }
    };
}
