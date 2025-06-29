// PDF Export Functionality for Sheep Farm Management System
// Uses jsPDF with Arabic font support

// Initialize jsPDF with Arabic font support
function initializePDFExport() {
    // This would need to include the actual jsPDF library and Arabic font
    // For now, we'll create the structure
    
    window.SFM_PDF = {
        exportReport: exportReportToPDF,
        exportAnimalProfile: exportAnimalProfileToPDF,
        exportHealthCertificate: exportHealthCertificateToPDF
    };
}

// Generic PDF export function
async function exportReportToPDF(reportType, reportData) {
    try {
        // Create PDF document
        const pdf = createPDFDocument();
        
        // Add header
        addPDFHeader(pdf, reportData.title || 'تقرير مزرعة الأغنام');
        
        // Add content based on report type
        switch(reportType) {
            case 'flockSummary':
                addFlockSummaryContent(pdf, reportData);
                break;
            case 'breedingPerformance':
                addBreedingPerformanceContent(pdf, reportData);
                break;
            case 'healthSummary':
                addHealthSummaryContent(pdf, reportData);
                break;
            case 'financialActuals':
                addFinancialContent(pdf, reportData);
                break;
            default:
                addGenericContent(pdf, reportData);
        }
        
        // Add footer
        addPDFFooter(pdf);
        
        // Save the PDF
        const filename = `${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
        savePDF(pdf, filename);
        
        showSfmAppNotification('تم تصدير التقرير بنجاح', 'success');
        
    } catch (error) {
        console.error('PDF Export Error:', error);
        showSfmAppNotification('فشل تصدير التقرير', 'error');
    }
}

// Export individual animal profile as PDF
async function exportAnimalProfileToPDF(animalId) {
    const animal = sfmData.animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const pdf = createPDFDocument();
    
    // Header
    addPDFHeader(pdf, `بطاقة الحيوان - ${animal.tagId}`);
    
    // Animal photo if exists
    if (animal.photoDataUrl) {
        // Add photo to PDF
        // pdf.addImage(animal.photoDataUrl, 'JPEG', x, y, width, height);
    }
    
    // Basic information
    const info = {
        'الرقم التعريفي': animal.tagId,
        'الاسم': animal.name || '-',
        'السلالة': animal.breed,
        'الجنس': animal.sex === 'male' ? 'ذكر' : 'أنثى',
        'تاريخ الميلاد': sfmFormatDate(animal.birthDate),
        'العمر': calculateAge(animal.birthDate),
        'الحالة': getAnimalStatusText(animal.status)
    };
    
    // Add info to PDF
    addInfoSection(pdf, 'المعلومات الأساسية', info);
    
    // Health records
    const healthRecords = sfmData.healthRecords
        .filter(hr => hr.animalId === animalId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (healthRecords.length > 0) {
        addTableSection(pdf, 'السجل الصحي', healthRecords, [
            { key: 'date', label: 'التاريخ', format: sfmFormatDate },
            { key: 'type', label: 'النوع', format: getHealthRecordTypeText },
            { key: 'condition', label: 'الحالة' },
            { key: 'medication', label: 'العلاج' }
        ]);
    }
    
    // Weight history
    if (animal.weightHistory && animal.weightHistory.length > 0) {
        addChartSection(pdf, 'تطور الوزن', animal.weightHistory);
    }
    
    // Save
    savePDF(pdf, `animal-${animal.tagId}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Export health certificate
async function exportHealthCertificateToPDF(animalId) {
    const animal = sfmData.animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const pdf = createPDFDocument();
    
    // Official header
    addPDFHeader(pdf, 'شهادة صحية بيطرية', true);
    
    // Certificate content
    const content = {
        'رقم الشهادة': `HC-${Date.now()}`,
        'تاريخ الإصدار': sfmFormatDate(new Date()),
        'صالحة حتى': sfmFormatDate(new Date(Date.now() + 30*24*60*60*1000))
    };
    
    addInfoSection(pdf, 'بيانات الشهادة', content);
    
    // Animal information
    const animalInfo = {
        'الرقم التعريفي': animal.tagId,
        'السلالة': animal.breed,
        'الجنس': animal.sex === 'male' ? 'ذكر' : 'أنثى',
        'اللون/العلامات': animal.color || animal.notes || '-',
        'العمر': calculateAge(animal.birthDate)
    };
    
    addInfoSection(pdf, 'بيانات الحيوان', animalInfo);
    
    // Vaccinations
    const vaccinations = sfmData.healthRecords
        .filter(hr => hr.animalId === animalId && hr.type === 'vaccination')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (vaccinations.length > 0) {
        addTableSection(pdf, 'التحصينات', vaccinations, [
            { key: 'condition', label: 'نوع التحصين' },
            { key: 'date', label: 'التاريخ', format: sfmFormatDate },
            { key: 'medication', label: 'اللقاح المستخدم' }
        ]);
    }
    
    // Health declaration
    addTextSection(pdf, 'إقرار صحي', 
        'أقر أنا الموقع أدناه بأن الحيوان المذكور أعلاه خالٍ من الأمراض المعدية والوبائية وصالح للنقل والذبح وفقاً للوائح الصحية المعمول بها.'
    );
    
    // Signature area
    addSignatureSection(pdf);
    
    // Save
    savePDF(pdf, `health-certificate-${animal.tagId}-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Helper functions for PDF generation
function createPDFDocument() {
    // This is a placeholder - actual implementation would use jsPDF
    return {
        pages: [],
        currentPage: 0,
        addPage: function() { this.pages.push([]); this.currentPage++; },
        addContent: function(content) { this.pages[this.currentPage].push(content); }
    };
}

function addPDFHeader(pdf, title, isOfficial = false) {
    pdf.addContent({
        type: 'header',
        title: title,
        farmName: sfmData.settings.farmName,
        date: new Date().toLocaleDateString('ar-EG'),
        isOfficial: isOfficial
    });
}

function addPDFFooter(pdf) {
    pdf.addContent({
        type: 'footer',
        pageNumber: pdf.currentPage + 1,
        timestamp: new Date().toLocaleString('ar-EG')
    });
}

function addInfoSection(pdf, sectionTitle, info) {
    pdf.addContent({
        type: 'info',
        title: sectionTitle,
        data: info
    });
}

function addTableSection(pdf, sectionTitle, data, columns) {
    pdf.addContent({
        type: 'table',
        title: sectionTitle,
        data: data,
        columns: columns
    });
}

function addChartSection(pdf, sectionTitle, data) {
    pdf.addContent({
        type: 'chart',
        title: sectionTitle,
        data: data
    });
}

function addTextSection(pdf, sectionTitle, text) {
    pdf.addContent({
        type: 'text',
        title: sectionTitle,
        text: text
    });
}

function addSignatureSection(pdf) {
    pdf.addContent({
        type: 'signature',
        fields: [
            { label: 'اسم الطبيب البيطري', line: true },
            { label: 'رقم الترخيص', line: true },
            { label: 'التوقيع', line: true },
            { label: 'الختم', box: true }
        ]
    });
}

function savePDF(pdf, filename) {
    // Placeholder for actual PDF save
    // In actual implementation:
    // pdf.save(filename);
}

// Utility functions
function calculateAge(birthDate) {
    if (!birthDate) return 'غير محدد';
    
    const birth = new Date(birthDate);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birth.getFullYear()) * 12 + 
                       (now.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
        return `${ageInMonths} شهر`;
    } else {
        const years = Math.floor(ageInMonths / 12);
        const months = ageInMonths % 12;
        return months > 0 ? `${years} سنة و ${months} شهر` : `${years} سنة`;
    }
}

function getAnimalStatusText(status) {
    const statuses = {
        active: 'نشط',
        sold: 'مباع',
        deceased: 'نافق',
        culled: 'مستبعد'
    };
    return statuses[status] || status;
}

function getHealthRecordTypeText(type) {
    const types = {
        treatment: 'علاج',
        vaccination: 'تحصين',
        deworming: 'مكافحة طفيليات',
        checkup: 'فحص دوري'
    };
    return types[type] || type;
}

// Add PDF export buttons to existing UI
function addPDFExportButtons() {
    // Add to report output area
    const reportArea = document.getElementById('reportOutputArea');
    if (reportArea && !document.getElementById('pdfExportBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'pdfExportBtn';
        exportBtn.className = 'btn btn-primary btn-sm';
        exportBtn.innerHTML = '📄 تصدير PDF';
        exportBtn.style.position = 'absolute';
        exportBtn.style.top = '10px';
        exportBtn.style.left = '10px';
        exportBtn.onclick = () => {
            const reportType = reportArea.getAttribute('data-report-type');
            const reportData = reportArea.getAttribute('data-report-data');
            if (reportType && reportData) {
                exportReportToPDF(reportType, JSON.parse(reportData));
            }
        };
        reportArea.appendChild(exportBtn);
    }
    
    // Add to animal detail modals
    // This would be integrated into existing modal generation
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initializePDFExport();
    addPDFExportButtons();
});