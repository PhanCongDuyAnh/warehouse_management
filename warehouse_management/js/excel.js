// ==========================================
// EXCEL GENERATOR — SheetJS (XLSX)
// ==========================================
function getExcelMethods() {
    return {
        exportAdvancedExcel() {
            try {
                const wb = XLSX.utils.book_new();

                // 1. Sheet: Inventory
                const invData = this.inventoryList.map(item => ({
                    'Mã SKU': item.id,
                    'Tên sản phẩm': item.name,
                    'Danh mục': item.category,
                    'Số lượng': item.stock,
                    'Trạng thái': item.status,
                    'Vị trí': item.pos,
                    'Khu vực': item.warehouseZone,
                    'Chất lượng (%)': item.quality?.toFixed(1) || 100,
                    'Hạn sử dụng': item.expiryDate || 'N/A',
                    'Giá nhập': item.buyPrice || 0,
                    'Giá bán hiện tại': item.currentSellPrice || 0
                }));
                const wsInv = XLSX.utils.json_to_sheet(invData);
                XLSX.utils.book_append_sheet(wb, wsInv, "Inventory");

                // 2. Sheet: Financial
                const finance = this.getFinancialMetrics();
                const finData = [
                    { 'Chỉ số': 'Tổng doanh thu', 'Giá trị': finance.revenue, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Giá vốn hàng bán (COGS)', 'Giá trị': finance.cogs, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Chi phí nhiên liệu', 'Giá trị': finance.fuelCost, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Chi phí điện năng', 'Giá trị': finance.electricityCost, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Chi phí nhân sự', 'Giá trị': finance.salaryCost, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Tổn thất hàng hỏng', 'Giá trị': finance.lossCost, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Lợi nhuận ròng', 'Giá trị': finance.netProfit, 'Đơn vị': 'VNĐ' },
                    { 'Chỉ số': 'Biên lợi nhuận', 'Giá trị': finance.margin + '%', 'Đơn vị': '%' }
                ];
                const wsFin = XLSX.utils.json_to_sheet(finData);
                XLSX.utils.book_append_sheet(wb, wsFin, "Financial");

                // 3. Sheet: Logistics
                const logData = this.shippingList.map(s => ({
                    'Mã vận đơn': s.trackId,
                    'Mã đơn hàng': s.orderId,
                    'Điểm đến': s.destination,
                    'Phương tiện': s.vehicleType,
                    'Tài xế': s.driverName,
                    'Trạng thái': s.shippingStatus,
                    'Quãng đường (km)': s.distance || 0,
                    'Nhiên liệu (L)': s.fuelConsumed || 0,
                    'ETA': s.estimatedArrival?.replace('T', ' ') || 'N/A'
                }));
                const wsLog = XLSX.utils.json_to_sheet(logData);
                XLSX.utils.book_append_sheet(wb, wsLog, "Logistics");

                // 4. Sheet: AI Logs
                const aiData = this.chatMessages.filter(m => m.sender === 'ai').map(m => ({
                    'Thời gian': new Date().toLocaleString('vi-VN'),
                    'Nội dung Insight': m.text.replace(/<[^>]*>?/gm, '') // Remove HTML tags
                }));
                const wsAI = XLSX.utils.json_to_sheet(aiData);
                XLSX.utils.book_append_sheet(wb, wsAI, "AI Logs");

                // 5. Sheet: Simulation History
                const simData = (this.simEventLog || []).map(e => ({
                    'Thời gian ảo': e.time,
                    'Sự kiện': e.html.replace(/<[^>]*>?/gm, '')
                }));
                const wsSim = XLSX.utils.json_to_sheet(simData);
                XLSX.utils.book_append_sheet(wb, wsSim, "Simulation History");

                // Export
                const fileName = `Warehouse_Advanced_Export_${new Date().getTime()}.xlsx`;
                XLSX.writeFile(wb, fileName);
                this.toast('Đã xuất file Excel đa sheet thành công!', 'success');

            } catch (error) {
                console.error('Excel Export Error:', error);
                this.toast('Có lỗi khi xuất Excel: ' + error.message, 'error');
            }
        },
        exportShippingExcel() {
            try {
                const wb = XLSX.utils.book_new();
                
                const data = this.shippingList.map(s => ({
                    'Mã vận đơn': s.trackId,
                    'Mã đơn hàng': s.orderId,
                    'Hub xuất phát': s.originHub || 'Kho tổng HN',
                    'Loại phương tiện': s.vehicleType,
                    'Địa chỉ giao': s.destination,
                    'Phân loại': s.type,
                    'Người phụ trách xuất kho': s.exportStaff || 'N/A',
                    'Vai trò xuất kho': s.exportRole || 'N/A',
                    'Người phụ trách vận chuyển': s.driverName || s.shipStaff || 'N/A',
                    'Trạng thái hiện tại': s.shippingStatus,
                    'Quãng đường (km)': s.distance || 0,
                    'Nhiên liệu (L)': s.fuelConsumed || 0
                }));

                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, "Shipping List");

                const fileName = `Shipping_List_${new Date().getTime()}.xlsx`;
                XLSX.writeFile(wb, fileName);
                this.toast('Đã xuất danh sách vận chuyển thành công!', 'success');
            } catch (error) {
                console.error('Shipping Export Error:', error);
                this.toast('Lỗi xuất Excel vận chuyển: ' + error.message, 'error');
            }
        }
    };
}
