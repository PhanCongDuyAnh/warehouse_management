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
                // --- Cập nhật KPI với dao động ---
                const period = this.reportPeriod;
                const baseRev = period === 'Ngày' ? 850 : period === 'Tuần' ? 5200 : period === 'Tháng' ? 1280 : period === 'Quý' ? 3900 : 14200;
                const revM = this.rnd(baseRev, 0.12);
                const profM = this.rnd(revM * 0.32, 0.15);
                const up1 = Math.random() > 0.35;
                const up2 = Math.random() > 0.3;
                const fmt = (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'Tr đ' : v.toFixed(0) + 'K đ';
                this.statsKpi = {
                    revenue: fmt(revM), revenueUp: up1, revenueDelta: (this.rnd(8, 0.8)).toFixed(1) + '%',
                    profit: fmt(profM), profitUp: up2, profitDelta: (this.rnd(12, 0.9)).toFixed(1) + '%',
                    otd: this.rnd(94, 0.04), error: this.rnd(0.24, 0.3),
                    warehouse: this.rnd(35, 0.1)
                };
                this.detailedKpis = [
                    { label: 'Đơn/Ngày', sub: 'Trung bình xử lý', value: this.rnd(42, 0.15).toFixed(1), delta: this.rnd(3, 0.5).toFixed(1) + '%', up: Math.random() > 0.4, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'fas fa-shopping-cart', iconBg: 'bg-indigo-500' },
                    { label: 'Thời gian XL', sub: 'Phút/đơn TB', value: this.rnd(18.5, 0.12).toFixed(1) + 'p', delta: this.rnd(2, 0.6).toFixed(1) + '%', up: Math.random() > 0.5, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'fas fa-clock', iconBg: 'bg-amber-500' },
                    { label: 'Vòng quay kho', sub: 'Lần/kỳ', value: this.rnd(4.2, 0.15).toFixed(1) + 'x', delta: this.rnd(5, 0.7).toFixed(1) + '%', up: Math.random() > 0.4, color: 'text-green-600', bg: 'bg-green-50', icon: 'fas fa-boxes-stacked', iconBg: 'bg-green-500' },
                    { label: 'Tỉ lệ lấp đầy', sub: '% diện tích kho dùng', value: this.rnd(65, 0.08).toFixed(0) + '%', delta: this.rnd(3, 0.5).toFixed(1) + '%', up: Math.random() > 0.5, color: 'text-purple-600', bg: 'bg-purple-50', icon: 'fas fa-warehouse', iconBg: 'bg-purple-500' },
                    { label: 'NPS khách hàng', sub: 'Điểm hài lòng', value: this.rnd(87, 0.05).toFixed(0) + '/100', delta: this.rnd(4, 0.6).toFixed(1) + '%', up: Math.random() > 0.35, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fas fa-star', iconBg: 'bg-emerald-500' },
                ];

                const labels = this.getLabels();
                const baseArr = this.getBaseRevenue();
                const revenueData = baseArr.map(v => this.rnd(v, 0.15));
                const profitData = revenueData.map(v => +(v * this.rnd(0.32, 0.1)).toFixed(1));
                const forecastLen = Math.ceil(labels.length / 3);
                const futureLabels = labels.slice(-forecastLen).map(l => l + '*');
                const lastRev = revenueData[revenueData.length - 1];
                const forecastBase = Array.from({ length: forecastLen }, (_, i) => +(lastRev * (1 + 0.05 * (i + 1))).toFixed(1));
                const forecastOpt = forecastBase.map(v => this.rnd(v * 1.15, 0.08));
                const forecastPes = forecastBase.map(v => this.rnd(v * 0.85, 0.08));

                // Chart 1: Revenue main
                this.destroyChart('revMain');
                const c1 = document.getElementById('revenueMainChart')?.getContext('2d');
                if (c1) this._charts['revMain'] = new Chart(c1, {
                    type: 'bar',
                    data: {
                        labels: [...labels.slice(0, -forecastLen), ...futureLabels],
                        datasets: [
                            { label: 'Doanh thu', data: [...revenueData.slice(0, -forecastLen), ...Array(forecastLen).fill(null)], backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6, order: 2 },
                            { label: 'Lợi nhuận', data: [...profitData.slice(0, -forecastLen), ...Array(forecastLen).fill(null)], backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6, order: 2 },
                            { label: 'Dự báo DT', data: [...Array(labels.length - forecastLen).fill(null), ...forecastBase], type: 'line', borderColor: '#f59e0b', borderDash: [5, 5], pointStyle: 'star', pointRadius: 5, tension: 0.4, order: 1, fill: false }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } } } }
                });

                // Chart 2: Capital donut
                this.destroyChart('capDonut');
                const c2 = document.getElementById('capitalDonutChart')?.getContext('2d');
                if (c2) this._charts['capDonut'] = new Chart(c2, {
                    type: 'doughnut',
                    data: { labels: ['Hàng sẵn có', 'Đang về', 'Nợ NCC', 'Ký gửi'], datasets: [{ data: [this.rnd(45, 0.08), this.rnd(25, 0.1), this.rnd(15, 0.12), this.rnd(15, 0.1)], backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#94a3b8'], borderWidth: 0, hoverOffset: 10 }] },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false } } }
                });

                // Chart 3: Inventory Forecast với CI bands
                this.destroyChart('invForecast');
                const c3 = document.getElementById('inventoryForecastChart')?.getContext('2d');
                if (c3) {
                    const invBase = Array.from({ length: labels.length }, (_, i) => this.rnd(200 + i * 8, 0.12));
                    const invUpper = invBase.map(v => +(v * 1.18).toFixed(1));
                    const invLower = invBase.map(v => +(v * 0.82).toFixed(1));
                    this._charts['invForecast'] = new Chart(c3, {
                        type: 'line',
                        data: {
                            labels,
                            datasets: [
                                { label: 'Giới hạn trên', data: invUpper, borderColor: 'rgba(99,102,241,0.2)', backgroundColor: 'rgba(99,102,241,0.08)', fill: '+1', tension: 0.4, pointRadius: 0, borderWidth: 1 },
                                { label: 'Tồn kho dự báo', data: invBase, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: false, tension: 0.4, pointRadius: 3, borderWidth: 2.5 },
                                { label: 'Giới hạn dưới', data: invLower, borderColor: 'rgba(99,102,241,0.2)', backgroundColor: 'rgba(99,102,241,0.08)', fill: '-1', tension: 0.4, pointRadius: 0, borderWidth: 1 },
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.04)' } } } }
                    });
                }

                // Chart 4: In/Out bar
                this.destroyChart('inOut');
                const c4 = document.getElementById('inOutChart')?.getContext('2d');
                if (c4) this._charts['inOut'] = new Chart(c4, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Nhập kho', data: baseArr.map(v => this.rnd(v * 0.7, 0.2)), backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 5 },
                            { label: 'Xuất kho', data: baseArr.map(v => this.rnd(v * 0.85, 0.2)), backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 5 }
                        ]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } }, scales: { y: { beginAtZero: true, stacked: false, grid: { color: 'rgba(0,0,0,0.04)' } } } }
                });

                // Chart 5: Revenue Forecast 3 scenarios
                this.destroyChart('revForecast');
                const c5 = document.getElementById('revenueForecastChart')?.getContext('2d');
                if (c5) {
                    const fLabels = [...labels, ...Array.from({ length: forecastLen }, (_, i) => (labels[labels.length - 1] || '') + '+' + (i + 1))];
                    const hist = revenueData;
                    const optArr = [...hist, ...forecastOpt];
                    const baseF = [...hist, ...forecastBase];
                    const pesArr = [...hist, ...forecastPes];
                    this._charts['revForecast'] = new Chart(c5, {
                        type: 'line',
                        data: {
                            labels: fLabels,
                            datasets: [
                                { label: 'Lạc quan', data: optArr, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.07)', fill: true, tension: 0.4, pointRadius: 2 },
                                { label: 'Cơ sở', data: baseF, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.07)', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2.5 },
                                { label: 'Bi quan', data: pesArr, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: true, tension: 0.4, pointRadius: 2 },
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } }, scales: { y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.04)' } } } }
                    });
                }

                // Chart 6: Operation Cost pie
                this.destroyChart('opCost');
                const c6 = document.getElementById('operationCostChart')?.getContext('2d');
                if (c6) this._charts['opCost'] = new Chart(c6, {
                    type: 'doughnut',
                    data: { labels: ['Hàng hóa', 'Nhân sự', 'Vận chuyển', 'Mặt bằng'], datasets: [{ data: [this.rnd(60, 0.05), this.rnd(20, 0.08), this.rnd(15, 0.1), this.rnd(5, 0.15)], backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '55%' }
                });

                // Chart 7: Order velocity
                this.destroyChart('ordVel');
                const c7 = document.getElementById('orderVelocityChart')?.getContext('2d');
                if (c7) this._charts['ordVel'] = new Chart(c7, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Đơn/ngày', data: labels.map(() => this.rnd(42, 0.2)), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 5, yAxisID: 'y' },
                            { label: 'Thời gian XL (phút)', data: labels.map(() => this.rnd(18.5, 0.15)), type: 'line', borderColor: '#f59e0b', tension: 0.4, pointRadius: 3, borderWidth: 2, yAxisID: 'y1', fill: false }
                        ]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold' } } } },
                        scales: {
                            y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(0,0,0,0.04)' } },
                            y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }
                        }
                    }
                });

                // Auto-refresh mỗi 8 giây khi ở tab reports
                clearInterval(this._reportInterval);
                this._reportInterval = setInterval(() => {
                    if (this.currentTab === 'reports') this.refreshReports();
                }, 8000);
            } else {
                clearInterval(this._reportInterval);
            }
        }
    };
}
