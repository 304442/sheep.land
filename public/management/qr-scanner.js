// QR Code Scanner for Sheep Farm Management System
// Enables quick animal identification and data entry

class SheepFarmQRScanner {
    constructor() {
        this.scanner = null;
        this.videoElement = null;
        this.isScanning = false;
        this.onScanCallback = null;
    }
    
    // Initialize scanner UI
    createScannerUI() {
        // Create scanner modal
        const modal = document.createElement('div');
        modal.id = 'qrScannerModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content-sfms" style="max-width: 400px;">
                <div class="modal-header-sfms">
                    <h3>مسح رمز QR</h3>
                    <button class="modal-close-btn-sfms" onclick="sfmQRScanner.stopScanning()">✕</button>
                </div>
                <div class="modal-body-sfms" style="text-align: center;">
                    <video id="qrScannerVideo" style="width: 100%; max-width: 300px; border-radius: 8px;"></video>
                    <div id="qrScannerStatus" style="margin-top: 10px; color: #666;">
                        جاري تشغيل الكاميرا...
                    </div>
                    <canvas id="qrScannerCanvas" style="display: none;"></canvas>
                </div>
                <div class="modal-footer-sfms">
                    <button class="btn btn-secondary" onclick="sfmQRScanner.switchCamera()">تبديل الكاميرا</button>
                    <button class="btn btn-danger" onclick="sfmQRScanner.stopScanning()">إلغاء</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.videoElement = document.getElementById('qrScannerVideo');
    }
    
    // Start scanning
    async startScanning(callback) {
        if (this.isScanning) return;
        
        this.onScanCallback = callback;
        this.isScanning = true;
        
        // Create UI if not exists
        if (!document.getElementById('qrScannerModal')) {
            this.createScannerUI();
        }
        
        // Show modal
        document.getElementById('qrScannerModal').classList.add('active');
        
        try {
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 300 },
                    height: { ideal: 300 }
                }
            });
            
            this.videoElement.srcObject = stream;
            await this.videoElement.play();
            
            // Update status
            document.getElementById('qrScannerStatus').textContent = 'وجّه الكاميرا نحو رمز QR';
            
            // Start scanning loop
            this.scanLoop();
            
        } catch (error) {
            console.error('Camera error:', error);
            document.getElementById('qrScannerStatus').textContent = 'فشل الوصول للكاميرا';
            showSfmAppNotification('لا يمكن الوصول للكاميرا', 'error');
        }
    }
    
    // Scanning loop
    scanLoop() {
        if (!this.isScanning) return;
        
        const canvas = document.getElementById('qrScannerCanvas');
        const context = canvas.getContext('2d');
        
        if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
            canvas.width = this.videoElement.videoWidth;
            canvas.height = this.videoElement.videoHeight;
            context.drawImage(this.videoElement, 0, 0);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Here we would use a QR code detection library
            // For now, simulate QR code detection
            const qrCode = this.detectQRCode(imageData);
            
            if (qrCode) {
                this.handleScanResult(qrCode);
                return;
            }
        }
        
        // Continue scanning
        requestAnimationFrame(() => this.scanLoop());
    }
    
    // Mock QR detection (replace with actual library)
    detectQRCode(imageData) {
        // This is where jsQR or similar library would process the image
        // For demonstration, return null (no QR found)
        return null;
    }
    
    // Handle successful scan
    handleScanResult(qrData) {
        // Stop scanning
        this.stopScanning();
        
        // Parse QR data
        try {
            const data = JSON.parse(qrData);
            
            if (data.type === 'animal' && data.id) {
                // Navigate to animal profile
                const animal = sfmData.animals.find(a => a.id === data.id);
                if (animal) {
                    showSfmAppNotification(`تم العثور على: ${animal.tagId}`, 'success');
                    if (this.onScanCallback) {
                        this.onScanCallback(data);
                    } else {
                        // Default action - open animal profile
                        openAnimalDetailModal(data.id);
                    }
                } else {
                    showSfmAppNotification('الحيوان غير موجود', 'error');
                }
            } else {
                // Handle other QR types
                if (this.onScanCallback) {
                    this.onScanCallback(data);
                }
            }
            
        } catch (error) {
            // Plain text QR code
            if (this.onScanCallback) {
                this.onScanCallback({ text: qrData });
            }
        }
    }
    
    // Stop scanning
    stopScanning() {
        this.isScanning = false;
        
        // Stop camera
        if (this.videoElement && this.videoElement.srcObject) {
            const tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
        
        // Hide modal
        const modal = document.getElementById('qrScannerModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    // Switch camera (front/back)
    async switchCamera() {
        // Implementation for camera switching
        showSfmAppNotification('تبديل الكاميرا...', 'info');
    }
}

// QR Code Generator
class SheepFarmQRGenerator {
    // Generate QR code for animal
    static generateAnimalQR(animalId) {
        const animal = sfmData.animals.find(a => a.id === animalId);
        if (!animal) return null;
        
        const qrData = {
            type: 'animal',
            id: animal.id,
            tagId: animal.tagId,
            farm: sfmData.settings.farmName,
            timestamp: new Date().toISOString()
        };
        
        return JSON.stringify(qrData);
    }
    
    // Generate QR code for location/pen
    static generateLocationQR(locationId, locationName) {
        const qrData = {
            type: 'location',
            id: locationId,
            name: locationName,
            farm: sfmData.settings.farmName
        };
        
        return JSON.stringify(qrData);
    }
    
    // Create printable QR cards
    static createPrintableCard(animal) {
        const qrData = this.generateAnimalQR(animal.id);
        
        // This would use a QR generation library to create the image
        const qrImageUrl = 'data:image/png;base64,...'; // Generated QR image
        
        const cardHTML = `
            <div class="qr-card" style="width: 8cm; height: 5cm; border: 1px solid #ddd; padding: 10px; display: inline-block; margin: 5px;">
                <div style="text-align: center;">
                    <img src="${qrImageUrl}" style="width: 3cm; height: 3cm;">
                    <div style="margin-top: 5px;">
                        <strong>${animal.tagId}</strong><br>
                        ${animal.name || animal.breed}<br>
                        <small>${sfmData.settings.farmName}</small>
                    </div>
                </div>
            </div>
        `;
        
        return cardHTML;
    }
    
    // Print QR cards for selected animals
    static printQRCards(animalIds) {
        const printWindow = window.open('', '_blank');
        const cards = animalIds.map(id => {
            const animal = sfmData.animals.find(a => a.id === id);
            return animal ? this.createPrintableCard(animal) : '';
        }).join('');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>بطاقات QR - مزرعة الأغنام</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        @media print { 
                            .qr-card { page-break-inside: avoid; }
                            @page { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>${cards}</body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
}

// Quick entry using QR
function quickAnimalEntry() {
    sfmQRScanner.startScanning((result) => {
        if (result.type === 'animal') {
            // Open edit form for existing animal
            openAnimalFormModal(result.id);
        } else {
            // Create new animal with scanned data
            const newAnimalId = result.text || result.id;
            openAnimalFormModal(null, { tagId: newAnimalId });
        }
    });
}

// Add weight using QR scan
function quickWeightEntry() {
    sfmQRScanner.startScanning((result) => {
        if (result.type === 'animal') {
            // Open weight entry modal
            openQuickWeightModal(result.id);
        }
    });
}

// Quick weight entry modal
function openQuickWeightModal(animalId) {
    const animal = sfmData.animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const modalHTML = `
        <div class="input-field">
            <label>الحيوان: ${animal.tagId} - ${animal.name || animal.breed}</label>
        </div>
        <div class="input-field">
            <label for="quickWeight">الوزن (كجم):</label>
            <input type="number" id="quickWeight" step="0.1" inputmode="decimal" autofocus>
        </div>
        <div class="input-field">
            <label for="quickWeightDate">التاريخ:</label>
            <input type="date" id="quickWeightDate" value="${new Date().toISOString().split('T')[0]}">
        </div>
    `;
    
    openSfmFormModal('تسجيل وزن سريع', modalHTML, () => {
        const weight = parseFloat(document.getElementById('quickWeight').value);
        const date = document.getElementById('quickWeightDate').value;
        
        if (weight > 0) {
            if (!animal.weightHistory) animal.weightHistory = [];
            animal.weightHistory.push({ date, weight, type: 'routine' });
            saveSfmDataToLocalStorage();
            showSfmAppNotification('تم تسجيل الوزن', 'success');
            closeSfmFormModal();
        }
    });
}

// Add QR scanner button to UI
function addQRScannerButtons() {
    // Add to header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('qrScanBtn')) {
        const scanBtn = document.createElement('button');
        scanBtn.id = 'qrScanBtn';
        scanBtn.className = 'header-btn';
        scanBtn.innerHTML = '📷';
        scanBtn.title = 'مسح QR';
        scanBtn.onclick = () => quickAnimalEntry();
        headerActions.insertBefore(scanBtn, headerActions.firstChild);
    }
    
    // Add to animal list actions
    const batchActions = document.getElementById('animalBatchActionsBar');
    if (batchActions && !document.getElementById('printQRBtn')) {
        const printBtn = document.createElement('button');
        printBtn.id = 'printQRBtn';
        printBtn.className = 'btn btn-sm btn-secondary';
        printBtn.innerHTML = '🏷️ طباعة QR';
        printBtn.onclick = () => {
            const selected = getSelectedAnimalIds();
            if (selected.length > 0) {
                SheepFarmQRGenerator.printQRCards(selected);
            }
        };
        batchActions.appendChild(printBtn);
    }
}

// Initialize QR scanner
const sfmQRScanner = new SheepFarmQRScanner();

// Add buttons on load
document.addEventListener('DOMContentLoaded', function() {
    addQRScannerButtons();
});