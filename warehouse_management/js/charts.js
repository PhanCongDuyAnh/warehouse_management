// ==========================================
// CHART.JS — Khởi tạo và quản lý biểu đồ
// ==========================================
function getChartMethods() {
    return {
        // Tiện ích dao động ngẫu nhiên
        rnd(base, pct) { 
            const val = +(base * (1 + (Math.random() - 0.5) * pct * 2)).toFixed(1);
            return isNaN(val) ? 0 : val;
        },
        rndArr(base, len, pct) { return Array.from({ length: len }, () => this.rnd(base, pct)); },
        destroyChart(id) { 
            if (this._charts && this._charts[id]) { 
                this._charts[id].destroy(); 
                delete this._charts[id]; 
            } 
        },

        // Sinh nhãn theo kỳ
        getLabels() {
            const p = this.reportPeriod || 'Tháng';
            if (p === 'Ngày') return ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
            if (p === 'Tuần') return ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            if (p === 'Tháng') return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            if (p === 'Quý') return ['Q1', 'Q2', 'Q3', 'Q4'];
            return ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];
        },

        getBaseRevenue() {
            const p = this.reportPeriod || 'Tháng';
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
            // Clear any pending initialization to avoid race conditions
            if (this._initTimeout) clearTimeout(this._initTimeout);
            
            // Re-run with slight delay to ensure container visibility for Chart.js
            this._initTimeout = setTimeout(() => {
                this._executeInitCharts(tab);
                this._initTimeout = null;
            }, 150);
        },

        _executeInitCharts(tab) {
            if (tab === 'home') {
                this.destroyChart('mainRevenue'); 
                this.destroyChart('mainInventory');
                const ctx1 = document.getElementById('mainRevenueChart')?.getContext('2d');
                if (ctx1) {
                    this._charts['mainRevenue'] = new Chart(ctx1, {
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
                }
                const ctx2 = document.getElementById('mainInventoryChart')?.getContext('2d');
                const done = (this.orders || []).filter(o => o.status === 'Đã nhận').length || 12;
                const ship = (this.orders || []).filter(o => o.status === 'Đang giao').length || 5;
                const wait = (this.orders || []).filter(o => o.status === 'Chờ xử lý').length || 3;
                if (ctx2) {
                    this._charts['mainInventory'] = new Chart(ctx2, {
                        type: 'doughnut',
                        data: { labels: ['Đã nhận', 'Đang giao', 'Chờ xử lý'], datasets: [{ data: [done, ship, wait], backgroundColor: ['#10b981', '#6366f1', '#f59e0b'], borderWidth: 0, hoverOffset: 8 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } } }
                    });
                }
            }

            if (tab === 'reports') {
                const s = this.simState || {};
                const finance = this.getFinancialMetrics();
                const labels = this.getLabels();
                const baseArr = this.getBaseRevenue();
                
                const fmt = (v) => {
                    if (isNaN(v)) return '--';
                    return v >= 1e9 ? (v / 1e9).toFixed(2) + 'T đ' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'Tr đ' : v.toLocaleString('vi-VN') + ' đ';
                };
                
                // KPI Updates
                this.statsKpi = {
                    revenue: fmt(finance.revenue), 
                    revenueUp: s.scenario === 'peak_season', 
                    revenueDelta: (s.scenario === 'peak_season' ? '+15.4%' : '-2.1%'),
                    profit: fmt(finance.netProfit), 
                    profitUp: (finance.netProfit || 0) > 200000000, 
                    profitDelta: finance.riskLevel === 'High' ? '⚠️ High Risk' : 'Normal',
                    otd: (94 * (1/(s.weatherFactor || 1))).toFixed(1), 
                    error: (0.24 * (s.trafficFactor || 1)).toFixed(2),
                    warehouse: Math.round(this.totalWarehouseUsed ? this.totalWarehouseUsed() : 35)
                };
                
                // Detailed KPI Table Data
                this.detailedKpis = [
                    { label: 'Doanh thu thuần', value: fmt(finance.revenue), delta: '+12%', up: true, icon: 'fa-money-bill-trend-up', iconBg: 'bg-emerald-500', bg: 'bg-emerald-50/50', color: 'text-emerald-700', sub: 'Sau thuế & phí' },
                    { label: 'Giá vốn bán hàng', value: fmt(finance.cogs), delta: '+5%', up: false, icon: 'fa-cart-flatbed', iconBg: 'bg-indigo-500', bg: 'bg-indigo-50/50', color: 'text-indigo-700', sub: 'Giá nhập kho' },
                    { label: 'Chi phí vận hành', value: fmt(finance.electricityCost + finance.fuelCost), delta: '-2%', up: true, icon: 'fa-gas-pump', iconBg: 'bg-orange-500', bg: 'bg-orange-50/50', color: 'text-orange-700', sub: 'Điện & Nhiên liệu' },
                    { label: 'Lợi nhuận ròng', value: fmt(finance.netProfit), delta: '+18%', up: true, icon: 'fa-chart-pie', iconBg: 'bg-rose-500', bg: 'bg-rose-50/50', color: 'text-rose-700', sub: 'Net Profit Margin' }
                ];

                // --- Row 1: Revenue & Profit Heatmap ---
                const c1 = document.getElementById('revenueMainChart');
                if (c1) {
                    const ctx1 = c1.getContext('2d');
                    const scenMod = s.scenario === 'peak_season' ? 1.25 : s.scenario === 'storm' ? 0.75 : 1.0;
                    const revenueData = baseArr.map(v => this.rnd(v * scenMod, 0.1));
                    const margin = parseFloat(finance.margin) || 20;
                    const profitData = revenueData.map(v => +(v * (margin/100)).toFixed(1));
                    
                    this.destroyChart('revMain');
                    this._charts['revMain'] = new Chart(ctx1, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [
                                { label: 'Doanh thu', data: revenueData, backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6 },
                                { label: 'Lợi nhuận', data: profitData, backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
                    });
                }

                const c2 = document.getElementById('profitHeatmapChart');
                if (c2) {
                    const ctx2 = c2.getContext('2d');
                    const hLabels = Object.keys(finance.profitHeatmap || {}).length ? Object.keys(finance.profitHeatmap) : ['HN', 'HCM', 'DN', 'HP'];
                    const hData = hLabels.map(l => (finance.profitHeatmap && finance.profitHeatmap[l]?.profit) || this.rnd(5000000, 0.5));
                    
                    this.destroyChart('profitHeatmap');
                    this._charts['profitHeatmap'] = new Chart(ctx2, {
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
                        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
                    });
                }

                // --- Row 2: Costs & Capital ---
                const c3 = document.getElementById('financeBreakdownChart');
                if (c3) {
                    const ctx3 = c3.getContext('2d');
                    this.destroyChart('finBreakdown');
                    this._charts['finBreakdown'] = new Chart(ctx3, {
                        type: 'doughnut',
                        data: {
                            labels: ['Giá vốn', 'Lương', 'Năng lượng', 'Vận chuyển', 'Tổn thất'],
                            datasets: [{
                                data: [finance.cogs || 0, finance.salaryCost || 0, finance.electricityCost || 0, finance.fuelCost || 0, finance.lossCost || 0],
                                backgroundColor: ['#6366f1', '#a855f7', '#f59e0b', '#ef4444', '#64748b'],
                                borderWidth: 0
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } }
                    });
                }

                const cCap = document.getElementById('capitalDonutChart');
                if (cCap) {
                    const ctxCap = cCap.getContext('2d');
                    this.destroyChart('capDonut');
                    this._charts['capDonut'] = new Chart(ctxCap, {
                        type: 'pie',
                        data: {
                            labels: ['Vốn hàng hóa', 'Vốn lưu động', 'Nợ ngắn hạn', 'Khác'],
                            datasets: [{
                                data: [65, 20, 10, 5],
                                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#94a3b8'],
                                borderWidth: 0
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } }
                    });
                }

                // --- Row 3: Forecasting ---
                const c4 = document.getElementById('inventoryForecastChart');
                if (c4) {
                    const ctx4 = c4.getContext('2d');
                    const invBase = Array.from({ length: labels.length }, (_, i) => this.rnd(200 + i * 8, 0.12));
                    this.destroyChart('invForecast');
                    this._charts['invForecast'] = new Chart(ctx4, {
                        type: 'line',
                        data: { labels, datasets: [{ label: 'Tồn kho dự báo', data: invBase, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                    });
                }

                const cRevF = document.getElementById('revenueForecastChart');
                if (cRevF) {
                    const ctxRevF = cRevF.getContext('2d');
                    const lastRev = baseArr[baseArr.length - 1] || 1000;
                    const fLabels = Array.from({length: 6}, (_, i) => '+' + (i+1) + 'm');
                    const opt = fLabels.map((_, i) => this.rnd(lastRev * Math.pow(1.15, i+1), 0.05));
                    const base = fLabels.map((_, i) => this.rnd(lastRev * Math.pow(1.05, i+1), 0.05));
                    const pes = fLabels.map((_, i) => this.rnd(lastRev * Math.pow(0.9, i+1), 0.05));
                    
                    this.destroyChart('revForecast');
                    this._charts['revForecast'] = new Chart(ctxRevF, {
                        type: 'line',
                        data: {
                            labels: fLabels,
                            datasets: [
                                { label: 'Lạc quan', data: opt, borderColor: '#10b981', fill: false, tension: 0.4 },
                                { label: 'Cơ sở', data: base, borderColor: '#6366f1', fill: false, tension: 0.4 },
                                { label: 'Bi quan', data: pes, borderColor: '#ef4444', fill: false, tension: 0.4 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } } }
                    });
                }

                // --- Row 4: Performance ---
                const c5 = document.getElementById('orderVelocityChart');
                if (c5) {
                    const ctx5 = c5.getContext('2d');
                    this.destroyChart('ordVel');
                    this._charts['ordVel'] = new Chart(ctx5, {
                        type: 'bar',
                        data: { labels, datasets: [{ label: 'Đơn/ngày', data: labels.map(() => this.rnd(42, 0.2)), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 5 }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                    });
                }

                const c6 = document.getElementById('inOutChart');
                if (c6) {
                    const ctx6 = c6.getContext('2d');
                    this.destroyChart('inOut');
                    this._charts['inOut'] = new Chart(ctx6, {
                        type: 'bar',
                        data: {
                            labels,
                            datasets: [
                                { label: 'Nhập', data: baseArr.map(v => this.rnd(v * 0.7, 0.2)), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 5 },
                                { label: 'Xuất', data: baseArr.map(v => this.rnd(v * 0.85, 0.2)), backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 5 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                    });
                }

                // --- Row 5: Operational Costs ---
                const cOp = document.getElementById('operationCostChart');
                if (cOp) {
                    const ctxOp = cOp.getContext('2d');
                    this.destroyChart('opCost');
                    this._charts['opCost'] = new Chart(ctxOp, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [
                                { label: 'Năng lượng', data: baseArr.map(() => this.rnd(1200000, 0.15)), borderColor: '#f59e0b', tension: 0.4 },
                                { label: 'Nhiên liệu', data: baseArr.map(() => this.rnd(800000, 0.2)), borderColor: '#a855f7', tension: 0.4 },
                                { label: 'Nhân sự', data: baseArr.map(() => this.rnd(2500000, 0.05)), borderColor: '#6366f1', tension: 0.4 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                    });
                }

                // Auto-refresh logic (only if not already running)
                if (!this._reportInterval) {
                    this._reportInterval = setInterval(() => {
                        if (this.currentTab === 'reports' && !document.hidden) {
                            this.refreshReports();
                        }
                    }, 30000);
                }
            } else {
                if (this._reportInterval) {
                    clearInterval(this._reportInterval);
                    this._reportInterval = null;
                }
            }
        }
    };
}
