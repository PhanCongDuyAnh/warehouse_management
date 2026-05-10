// ==========================================
// PDF GENERATOR — jsPDF + AutoTable + QR + Barcode
// ==========================================
function getPdfMethods() {
    return {
        exportOrderPdf(order) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const primaryColor = [99, 102, 241]; // Indigo-600

            // 1. Header & Logo
            this._buildPdfHeader(doc, 'HÓA ĐƠN BÁN HÀNG', order.id);

            // 2. Customer Info
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('KHÁCH HÀNG:', 14, 50);
            doc.setTextColor(40);
            doc.setFont('helvetica', 'bold');
            doc.text(order.customer.toUpperCase(), 14, 55);
            doc.setFont('helvetica', 'normal');
            doc.text(`SĐT: ${order.phone}`, 14, 60);
            doc.text(`Địa chỉ: ${order.address}`, 14, 65);

            // 3. Order Details Table
            const tableData = [
                [
                    order.sku,
                    order.product,
                    order.qty,
                    this.simFmt(order.selectedLot?.currentSellPrice || 0) + 'đ',
                    this.simFmt(order.qty * (order.selectedLot?.currentSellPrice || 0)) + 'đ'
                ]
            ];

            doc.autoTable({
                startY: 75,
                head: [['SKU', 'SẢN PHẨM', 'SỐ LƯỢNG', 'ĐƠN GIÁ', 'THÀNH TIỀN']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: {
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 10;

            // 4. Summary
            const total = order.qty * (order.selectedLot?.currentSellPrice || 0);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('TỔNG CỘNG:', 140, finalY);
            doc.text(this.simFmt(total) + 'đ', 196, finalY, { align: 'right' });

            // 5. Barcode & QR
            this._buildBarcode(doc, order.id, 14, finalY + 10);
            this._buildQrCode(doc, `https://trito.vn/track/${order.id}`, 165, finalY + 10);

            // 6. Footer
            this._buildPdfFooter(doc);

            doc.save(`Invoice_${order.id}.pdf`);
            this.toast(`Đã xuất hóa đơn PDF cho đơn ${order.id}`, 'success');
        },

        exportShippingPdf(ship) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const primaryColor = [16, 185, 129]; // Green-600

            // 1. Header
            this._buildPdfHeader(doc, 'PHIẾU VẬN CHUYỂN', ship.trackId);

            // 2. Shipping Info
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('THÔNG TIN VẬN CHUYỂN:', 14, 50);
            doc.setTextColor(40);
            doc.text(`Mã đơn gốc: ${ship.orderId}`, 14, 58);
            doc.text(`Tài xế: ${ship.driverName || 'N/A'}`, 14, 63);
            doc.text(`Phương tiện: ${ship.vehicleType}`, 14, 68);
            doc.text(`Điểm đến: ${ship.destination}`, 14, 73);
            doc.text(`Trạng thái: ${ship.shippingStatus}`, 14, 78);

            // 3. Stats Table
            const tableData = [
                ['Quãng đường đã đi', (ship.distance || 0) + ' km'],
                ['Nhiên liệu tiêu thụ', (ship.fuelConsumed || 0) + ' L'],
                ['Dự kiến tới nơi (ETA)', ship.estimatedArrival ? ship.estimatedArrival.replace('T', ' ') : 'N/A']
            ];

            doc.autoTable({
                startY: 85,
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { fontStyle: 'bold', fillColor: [245, 245, 245], width: 60 },
                    1: { halign: 'left' }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 15;

            // 4. Barcode & QR
            this._buildBarcode(doc, ship.trackId, 14, finalY);
            this._buildQrCode(doc, `https://trito.vn/ship/${ship.trackId}`, 165, finalY);

            // 5. Footer
            this._buildPdfFooter(doc);

            doc.save(`Shipping_${ship.trackId}.pdf`);
            this.toast(`Đã xuất phiếu vận chuyển PDF cho ${ship.trackId}`, 'success');
        },

        _buildPdfHeader(doc, title, id) {
            // Logo TRITO
            doc.setFontSize(24);
            doc.setTextColor(99, 102, 241); // Indigo
            doc.setFont('helvetica', 'bold');
            doc.text('TRITO', 14, 22);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont('helvetica', 'normal');
            doc.text('SMART LOGISTICS SOLUTIONS', 14, 27);

            // Title
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text(title, 196, 22, { align: 'right' });
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`#${id}`, 196, 28, { align: 'right' });

            // Line
            doc.setDrawColor(230);
            doc.line(14, 35, 196, 35);
        },

        _buildBarcode(doc, text, x, y) {
            try {
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, text, {
                    format: "CODE128",
                    width: 2,
                    height: 40,
                    displayValue: true,
                    fontSize: 14
                });
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', x, y, 60, 20);
            } catch (e) {
                console.error('Barcode error:', e);
                doc.text(`Barcode: ${text}`, x, y + 10);
            }
        },

        _buildQrCode(doc, text, x, y) {
            try {
                const container = document.createElement('div');
                new QRCode(container, {
                    text: text,
                    width: 100,
                    height: 100
                });
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    const imgData = canvas.toDataURL('image/png');
                    doc.addImage(imgData, 'PNG', x, y, 30, 30);
                }
            } catch (e) {
                console.error('QR error:', e);
            }
        },

        _buildPdfFooter(doc) {
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Cam on ban da su dung dich vu cua TRITO Logistics.', 105, pageHeight - 20, { align: 'center' });
            doc.text('Website: www.trito.vn | Hotline: 1900-TRITO', 105, pageHeight - 15, { align: 'center' });
            doc.text('Trang 1/1', 196, pageHeight - 10, { align: 'right' });
        }
    };
}
