// ==========================================
// FINANCIAL HUB & AI INSIGHTS ENGINE
// Handle complex financial analysis and AI-driven predictions
// ==========================================

function getFinanceMethods() {
    return {
        // --- Financial Calculations ---
        getFinancialMetrics() {
            const s = this.simState;
            
            // 1. Revenue: Based on REAL completed orders + base simulation revenue
            const completedOrders = this.orders.filter(o => o.status === 'Đã nhận');
            const realOrderRevenue = completedOrders.reduce((sum, o) => {
                const item = this.inventoryList.find(p => p.id === o.sku);
                return sum + (o.qty * (item?.baseSellPrice || 100000));
            }, 0);
            
            const revenue = (s.totalRevenue * 0.7) + realOrderRevenue;
            
            // 2. COGS: Based on real items sold
            const realCOGS = completedOrders.reduce((sum, o) => {
                const item = this.inventoryList.find(p => p.id === o.sku);
                return sum + (o.qty * (item?.buyPrice || 70000));
            }, 0);
            const cogs = Math.round(revenue * 0.6) + realCOGS;
            
            // 3. Operating Costs (Impacted by Sim Scenarios)
            const heatFactor = s.scenario === 'heatwave' ? 1.8 : 1.0;
            const trafficFactor = s.scenario === 'peak_season' ? 1.5 : 1.0;

            const fuelCost = s.fuelCost || (s.totalFuelConsumed * 25000 * trafficFactor); 
            const electricityCost = (s.electricCost || 1250000) * heatFactor;
            
            // Salary calculation (From real employee list)
            const baseSalaries = {
                'Quản lý kho': 18000000,
                'Đóng gói': 9000000,
                'Tài xế': 11000000,
                'Nhân viên bốc xếp': 8500000,
                'Kỹ thuật IoT': 14000000
            };
            const salaryCost = this.employeeList.reduce((sum, emp) => sum + (baseSalaries[emp.position] || 8000000), 0);
            
            // 4. Warehouse Loss & Opportunity Loss
            const inventoryLoss = this.inventoryList.reduce((sum, item) => {
                const decayLoss = (item.buyPrice * item.stock) * ((100 - (item.quality || 100)) / 100);
                return sum + decayLoss;
            }, 0);
            
            // OPPORTUNITY LOSS: Potential revenue lost from goods nearing expiry
            const opportunityLoss = this.aiDiscountSuggestions().reduce((sum, p) => {
                const potentialRevenue = p.stock * p.baseSellPrice;
                return sum + (potentialRevenue * (p.suggestedDiscount / 100));
            }, 0);

            const lossCost = (s.damagedItems * 2500000) + (inventoryLoss * 0.2); 
            
            // 5. Net Profit
            const netProfit = revenue - cogs - fuelCost - electricityCost - salaryCost - lossCost;

            // 6. PROFIT HEATMAP (Routes)
            const profitHeatmap = this.shippingList.reduce((acc, ship) => {
                const dest = ship.destination || 'Khác';
                if (!acc[dest]) acc[dest] = { revenue: 0, cost: 0, profit: 0, count: 0 };
                
                const order = this.orders.find(o => o.id === ship.orderId);
                const orderRev = order ? (order.qty * 120000) : 100000; // Base estimate
                const orderCost = (ship.fuelConsumed * 25000) + 150000; // Fuel + fixed labor per trip
                
                acc[dest].revenue += orderRev;
                acc[dest].cost += orderCost;
                acc[dest].profit += (orderRev - orderCost);
                acc[dest].count++;
                return acc;
            }, {});

            // 7. DAMAGE PROJECTION (Scenario Based)
            const damageProjection = {
                estimatedLoss: 0,
                riskFactor: 1.0,
                message: 'Hệ thống vận hành ổn định.'
            };
            if (s.scenario === 'storm') {
                damageProjection.estimatedLoss = revenue * 0.15 + (inventoryLoss * 0.5);
                damageProjection.riskFactor = 2.5;
                damageProjection.message = 'Rủi ro cao do bão: Dự kiến thiệt hại 15% doanh thu và 50% hàng nhạy cảm.';
            } else if (s.scenario === 'heatwave') {
                damageProjection.estimatedLoss = electricityCost * 0.8 + (inventoryLoss * 0.3);
                damageProjection.riskFactor = 1.8;
                damageProjection.message = 'Sóng nhiệt: Chi phí điện tăng vọt và suy giảm chất lượng hàng lạnh.';
            }

            return {
                revenue, cogs, fuelCost, electricityCost, salaryCost, lossCost, netProfit, opportunityLoss,
                profitHeatmap, damageProjection,
                margin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0,
                riskLevel: (s.activeStorm || s.activeTraffic) ? 'High' : (s.scenario !== 'normal' ? 'Medium' : 'Low')
            };
        },

        // --- AI Insights Engine ---
        getAiInsights() {
            const insights = [];
            const s = this.simState;
            const finance = this.getFinancialMetrics();

            // 1. Economic Health Insight
            if (finance.margin < 15) {
                insights.push({
                    type: 'finance',
                    title: 'Cảnh báo biên lợi nhuận thấp',
                    desc: `Biên lợi nhuận hiện tại (${finance.margin}%) thấp hơn mục tiêu 20%. Cần tối ưu hóa lộ trình và giảm chi phí điện.`,
                    impact: 'Critical',
                    color: 'red'
                });
            }

            // 2. Opportunity Salvage Suggestions
            const salvageable = this.aiDiscountSuggestions();
            if (salvageable.length > 0) {
                insights.push({
                    type: 'salvage',
                    title: 'Giải cứu dòng vốn',
                    desc: `Có ${salvageable.length} mặt hàng sắp hết hạn. Áp dụng giảm giá theo đề xuất AI có thể cứu vãn ${this.simFmt(finance.opportunityLoss)} ₫.`,
                    impact: 'High',
                    color: 'orange'
                });
            }

            // 3. Logistics Optimization
            const highCostRoute = Object.entries(finance.profitHeatmap).find(([d, stats]) => stats.profit < 0);
            if (highCostRoute) {
                insights.push({
                    type: 'logistics',
                    title: 'Tối ưu lộ trình ' + highCostRoute[0],
                    desc: 'Lộ trình này đang ghi nhận lỗ. Đề xuất gom đơn hoặc chuyển sang phương tiện tiết kiệm nhiên liệu hơn.',
                    impact: 'Medium',
                    color: 'indigo'
                });
            }

            // 4. Scenario Risk Projection
            if (s.scenario !== 'normal') {
                insights.push({
                    type: 'risk',
                    title: 'Dự báo thiệt hại ' + s.scenario.toUpperCase(),
                    desc: finance.damageProjection.message,
                    impact: 'High',
                    color: 'rose'
                });
            }

            return insights;
        },

        // --- Charts Initialization ---
        initFinanceCharts() {
            // Update the main charts in reports tab
            // This is handled by initCharts('reports') in charts.js,
            // but we can add specific finance-only charts here if needed.
            
            const ctxBreakdown = document.getElementById('financeBreakdownChart')?.getContext('2d');
            const ctxHeatmap = document.getElementById('profitHeatmapChart')?.getContext('2d');
            
            if (!ctxBreakdown && !ctxHeatmap) return;

            const finance = this.getFinancialMetrics();

            // 1. Cost Breakdown (Doughnut)
            if (ctxBreakdown) {
                this.destroyChart('finance-breakdown');
                this._charts['finance-breakdown'] = new Chart(ctxBreakdown, {
                    type: 'doughnut',
                    data: {
                        labels: ['Giá vốn', 'Lương', 'Năng lượng', 'Vận chuyển', 'Tổn thất'],
                        datasets: [{
                            data: [finance.cogs, finance.salaryCost, finance.electricityCost, finance.fuelCost, finance.lossCost],
                            backgroundColor: ['#6366f1', '#a855f7', '#f59e0b', '#ef4444', '#64748b'],
                            borderWidth: 0,
                            hoverOffset: 15
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } } }
                    }
                });
            }

            // 2. Profit Heatmap (Horizontal Bar)
            if (ctxHeatmap) {
                this.destroyChart('finance-heatmap');
                const labels = Object.keys(finance.profitHeatmap);
                const data = labels.map(l => finance.profitHeatmap[l].profit);
                
                this._charts['finance-heatmap'] = new Chart(ctxHeatmap, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Lợi nhuận theo khu vực (₫)',
                            data: data,
                            backgroundColor: data.map(v => v >= 0 ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)'),
                            borderRadius: 10
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: { x: { grid: { display: false } } },
                        plugins: { legend: { display: false } }
                    }
                });
            }
        },
    };
}
