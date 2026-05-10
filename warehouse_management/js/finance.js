// ==========================================
// FINANCIAL HUB & AI INSIGHTS ENGINE
// Handle complex financial analysis and AI-driven predictions
// ==========================================

function getFinanceMethods() {
    return {
        // --- Financial Calculations ---
        getFinancialMetrics() {
            const s = this.simState;
            
            // 1. Revenue: Based on completed orders or simState
            const revenue = s.totalRevenue || 0;
            
            // 2. COGS: Estimated at 65% of revenue or calculated from inventory buyPrice
            // For simulation, let's use a dynamic COGS based on margin
            const cogs = Math.round(revenue * (1 - s.profitMargin));
            
            // 3. Operating Costs
            const fuelCost = s.totalFuelConsumed * 25000; // From simulation.js
            const electricityCost = s.electricCost || 0;
            
            // Salary calculation
            const baseSalaries = {
                'Quản lý kho': 18000000,
                'Đóng gói': 9000000,
                'Tài xế': 11000000,
                'Nhân viên bốc xếp': 8500000,
                'Kỹ thuật IoT': 14000000
            };
            const salaryCost = this.employeeList.reduce((sum, emp) => sum + (baseSalaries[emp.position] || 8000000), 0);
            
            // 4. Warehouse Loss (Damaged items)
            const lossCost = (s.damagedItems || 0) * 2500000; // Estimated 2.5M per item
            
            // 5. Net Profit
            const netProfit = revenue - cogs - fuelCost - electricityCost - salaryCost - lossCost;

            return {
                revenue, cogs, fuelCost, electricityCost, salaryCost, lossCost, netProfit,
                margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0
            };
        },

        // --- AI Insights Engine ---
        getAiInsights() {
            const insights = [];
            const today = this.simVirtualTime;

            // 1. Demand Forecast (Simulated)
            insights.push({
                type: 'forecast',
                title: 'Dự báo nhu cầu 7 ngày tới',
                desc: 'Dự kiến nhu cầu tăng 15% đối với nhóm Thực phẩm đông lạnh do ảnh hưởng thời tiết.',
                impact: 'High',
                color: 'indigo'
            });

            // 2. Restock Suggestions
            const lowStock = this.inventoryList.filter(p => p.stock < 50);
            if (lowStock.length > 0) {
                insights.push({
                    type: 'restock',
                    title: 'Gợi ý nhập hàng gấp',
                    desc: `Cần nhập thêm ${lowStock.slice(0, 2).map(p => p.name).join(', ')}... do tồn kho xuống dưới ngưỡng an toàn.`,
                    impact: 'Critical',
                    color: 'red'
                });
            }

            // 3. Route Optimization (Batching)
            const pendingShip = this.shippingList.filter(s => s.status === 'Đang chuẩn bị').length;
            if (pendingShip >= 3) {
                insights.push({
                    type: 'logistics',
                    title: 'Tối ưu hóa tuyến đường',
                    desc: `Phát hiện ${pendingShip} đơn hàng cùng khu vực Hà Đông. Gợi ý gom đơn để tiết kiệm 22% nhiên liệu.`,
                    impact: 'Medium',
                    color: 'green'
                });
            }

            // 4. Slow Moving Stock
            const slowMoving = this.inventoryList.filter(p => p.quality > 90 && p.stock > 500 && !p.expiryDate);
            if (slowMoving.length > 0) {
                insights.push({
                    type: 'inventory',
                    title: 'Cảnh báo hàng bán chậm',
                    desc: `Sản phẩm ${slowMoving[0].name} có vòng quay tồn kho thấp. Gợi ý chương trình khuyến mãi 10%.`,
                    impact: 'Low',
                    color: 'orange'
                });
            }

            // 5. Risk Alert
            if (this.simState.activeStorm || this.simState.activeTraffic) {
                insights.push({
                    type: 'risk',
                    title: 'Cảnh báo rủi ro vận hành',
                    desc: 'Điều kiện môi trường xấu gây nguy cơ chậm trễ ETA cho 85% vận đơn hiện tại.',
                    impact: 'High',
                    color: 'red'
                });
            }

            return insights;
        },

        // --- Charts Initialization ---
        initFinanceCharts() {
            const ctxBreakdown = document.getElementById('chart-cost-breakdown')?.getContext('2d');
            const ctxRevProfit = document.getElementById('chart-rev-profit')?.getContext('2d');
            const ctxLoss = document.getElementById('chart-inv-loss')?.getContext('2d');
            
            if (!ctxBreakdown || !ctxRevProfit) return;

            const finance = this.getFinancialMetrics();

            // Destroy existing charts if any (handled by Chart.js or this._charts)
            if (this._charts['finance-breakdown']) this._charts['finance-breakdown'].destroy();
            if (this._charts['finance-revprofit']) this._charts['finance-revprofit'].destroy();
            if (this._charts['finance-loss']) this._charts['finance-loss'].destroy();

            // 1. Cost Breakdown (Pie)
            this._charts['finance-breakdown'] = new Chart(ctxBreakdown, {
                type: 'doughnut',
                data: {
                    labels: ['COGS', 'Lương', 'Điện', 'Nhiên liệu', 'Thất thoát'],
                    datasets: [{
                        data: [finance.cogs, finance.salaryCost, finance.electricityCost, finance.fuelCost, finance.lossCost],
                        backgroundColor: ['#6366f1', '#a855f7', '#f59e0b', '#ef4444', '#64748b'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } }
                }
            });

            // 2. Revenue vs Profit (Bar)
            this._charts['finance-revprofit'] = new Chart(ctxRevProfit, {
                type: 'bar',
                data: {
                    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'],
                    datasets: [
                        { label: 'Doanh thu', data: [1.1e9, 1.3e9, 1.2e9, 1.4e9, finance.revenue], backgroundColor: '#6366f1', borderRadius: 8 },
                        { label: 'Lợi nhuận', data: [2.2e8, 2.8e8, 2.4e8, 3.1e8, finance.netProfit], backgroundColor: '#10b981', borderRadius: 8 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { callback: v => (v/1e6) + 'M' } } }
                }
            });

            // 3. Inventory Loss Trend (Line)
            this._charts['finance-loss'] = new Chart(ctxLoss, {
                type: 'line',
                data: {
                    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
                    datasets: [{
                        label: 'Giá trị hàng hỏng (VNĐ)',
                        data: [15e6, 28e6, 12e6, finance.lossCost / 10],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }
    };
}
