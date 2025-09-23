import { supabase } from "./supabase.js";
import "./loading.js";

// DOM Elements
const profileName = document.getElementById("profileName");
const logoutBtn = document.getElementById("logoutBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileOverlay = document.getElementById("mobileOverlay");
const certificateCount = document.getElementById("certificateCount");
const downloadCount = document.getElementById("downloadCount");
const certificatesContainer = document.getElementById("certificatesContainer");
const viewButtons = document.querySelectorAll(".view-btn");
const recognitionBtn = document.getElementById("recognitionBtn");

// Modal elements
const certificateModal = document.getElementById("certificateModal");
const modalClose = document.getElementById("modalClose");
const certificateName = document.getElementById("certificateName");
const certificateCourse = document.getElementById("certificateCourse");
const certificateDate = document.getElementById("certificateDate");
const certificateDuration = document.getElementById("certificateDuration");
const downloadCertificate = document.getElementById("downloadCertificate");
const shareCertificate = document.getElementById("shareCertificate");

let userCertificates = [];
let currentView = 'grid';
let selectedCertificate = null;

// Check authentication
function checkAuth() {
    const userPhone = localStorage.getItem("userPhone");
    const userName = localStorage.getItem("userName");
    
    if (!userPhone) {
        window.location.href = "index.html";
        return false;
    }
    
    if (userName && profileName) {
        profileName.textContent = userName;
    }
    
    return true;
}

// Load user certificates
async function loadCertificates() {
    try {
        window.LoadingManager.show('Loading your certificates...', 'certificates');
        
        const userPhone = localStorage.getItem("userPhone");
        
        // Show skeleton loading
        window.LoadingManager.showSkeleton('certificatesContainer', 'cards');
        
        // Fetch completed courses (100% progress)
        const { data: progressData, error: progressError } = await supabase
            .from("progress")
            .select("*")
            .eq("user_phone", userPhone)
            .eq("progress_percentage", 100);
            
        if (progressError) throw progressError;
        
        // Fetch course details for completed courses
        const courseIds = progressData.map(p => p.course_id);
        let coursesData = [];
        
        if (courseIds.length > 0) {
            const { data: courses, error: coursesError } = await supabase
                .from("courses")
                .select("id, title, category, duration_text, youtube_thumbnail_id, owner")
                .in("id", courseIds);
                
            if (coursesError) throw coursesError;
            coursesData = courses || [];
        }
        
        // Combine progress and course data
        const combinedData = progressData.map(progress => {
            const course = coursesData.find(c => c.id === progress.course_id);
            return {
                ...progress,
                courses: course
            };
        }).filter(item => item.courses);
        
        // Simulate minimum loading time
        await new Promise(resolve => setTimeout(resolve, 800));
        
        userCertificates = combinedData || [];
        
        updateStats();
        renderCertificates();
        
    } catch (error) {
        console.error("Error loading certificates:", error);
        showError("Failed to load your certificates");
    } finally {
        window.LoadingManager.hide('certificates');
    }
}

// Update statistics
function updateStats() {
    certificateCount.textContent = userCertificates.length;
    downloadCount.textContent = userCertificates.length; // Assuming all are downloaded
}

// Render certificates
function renderCertificates() {
    if (userCertificates.length === 0) {
        certificatesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-certificate"></i>
                <h3>No certificates yet</h3>
                <p>Complete courses to earn certificates</p>
                <a href="dashboard.html" class="btn-primary">Browse Courses</a>
            </div>
        `;
        return;
    }
    
    certificatesContainer.className = `certificates-${currentView}`;
    
    certificatesContainer.innerHTML = userCertificates.map((cert, index) => {
        const course = cert.courses;
        const completionDate = new Date(cert.updated_at).toLocaleDateString();
        
        if (currentView === 'grid') {
            return `
                <div class="certificate-card" data-cert-index="${index}">
                    <div class="certificate-preview">
                        <div class="course-thumbnail">
                            <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                                 alt="${course.title}"
                                 onerror="this.src='https://via.placeholder.com/300x180/6366f1/ffffff?text=${course.title.charAt(0)}'">
                        </div>
                        <div class="certificate-header">
                            <div class="certificate-logo">
                                <img src="img/logo.png" alt="VoltNexis Learn" style="height: 30px; width: auto; object-fit: contain;">
                            </div>
                        </div>
                        <div class="certificate-content">
                            <h4>Certificate of Achievement</h4>
                            <div class="student-info">
                                <p class="student-label">Awarded to</p>
                                <h5 class="student-name">${localStorage.getItem('userName') || 'Student'}</h5>
                            </div>
                            <div class="course-info">
                                <p class="course-label">For completing</p>
                                <h5 class="course-name">${course.title}</h5>
                                <p class="course-category">${course.category}</p>
                            </div>
                            <div class="certificate-date">${completionDate}</div>
                        </div>
                        <div class="certificate-actions">
                            <button class="action-btn" data-action="download" data-course-id="${cert.course_id}">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="action-btn" data-action="share" data-course-id="${cert.course_id}">
                                <i class="fas fa-share"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="certificate-list-item" data-cert-index="${index}">
                    <div class="certificate-thumbnail">
                        <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                             alt="${course.title}"
                             onerror="this.src='https://via.placeholder.com/80x60/6366f1/ffffff?text=${course.title.charAt(0)}'">
                        <div class="certificate-badge">
                            <i class="fas fa-certificate"></i>
                        </div>
                    </div>
                    <div class="certificate-info">
                        <h4>${course.title}</h4>
                        <p>${course.category}</p>
                        <div class="certificate-meta">
                            <span><i class="fas fa-calendar"></i> ${completionDate}</span>
                            <span><i class="fas fa-clock"></i> ${course.duration_text || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="certificate-actions">
                        <button class="btn-secondary" data-action="download" data-course-id="${cert.course_id}">
                            <i class="fas fa-download"></i>
                            Download
                        </button>
                        <button class="btn-primary" data-action="share" data-course-id="${cert.course_id}">
                            <i class="fas fa-share"></i>
                            Share
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Add event listeners for certificate cards and actions
    addCertificateEventListeners();
}

// Add event listeners for certificate interactions
function addCertificateEventListeners() {
    // Certificate card clicks
    document.querySelectorAll('.certificate-card, .certificate-list-item').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.certificate-actions')) {
                const certIndex = parseInt(card.dataset.certIndex);
                openCertificateModal(userCertificates[certIndex]);
            }
        });
    });
    
    // Action button clicks
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const courseId = btn.dataset.courseId;
            
            if (action === 'download') {
                downloadCertificatePDF(courseId);
            } else if (action === 'share') {
                shareCertificateLink(courseId);
            }
        });
    });
}

// Open certificate modal
function openCertificateModal(certData) {
    selectedCertificate = certData;
    const course = certData.courses;
    const userName = localStorage.getItem("userName") || "Student";
    const completionDate = new Date(certData.updated_at).toLocaleDateString();
    
    // Update modal content
    if (certificateName) certificateName.textContent = userName;
    if (certificateCourse) certificateCourse.textContent = course.title;
    if (certificateDate) certificateDate.textContent = completionDate;
    if (certificateDuration) certificateDuration.textContent = course.duration_text || 'N/A';
    
    // Set course image in modal
    const modalCourseImage = document.getElementById('modalCourseImage');
    if (modalCourseImage && course.youtube_thumbnail_id) {
        modalCourseImage.src = `https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg`;
        modalCourseImage.alt = course.title;
        modalCourseImage.onerror = function() {
            this.src = `https://via.placeholder.com/200x120/6366f1/ffffff?text=${course.title.charAt(0)}`;
        };
    }
    
    if (certificateModal) {
        certificateModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

// Close certificate modal
function closeCertificateModal() {
    certificateModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    selectedCertificate = null;
}

// Download certificate as PDF
function downloadCertificatePDF(courseId) {
    const cert = userCertificates.find(c => c.course_id === courseId);
    if (!cert) return;
    
    const course = cert.courses;
    const userName = localStorage.getItem('userName') || 'Student';
    const completionDate = new Date(cert.updated_at).toLocaleDateString();
    const courseImageUrl = `https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg`;
    
    // Create a temporary certificate element for PDF generation
    const tempCert = document.createElement('div');
    tempCert.style.cssText = 'position: absolute; left: -9999px; width: 1200px; height: 850px; background: white; padding: 0;';
    tempCert.innerHTML = `
        <div style="
            width: 100%; height: 100%; 
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%);
            border: 12px solid #667eea; 
            border-image: linear-gradient(135deg, #667eea, #764ba2) 1;
            padding: 40px; 
            box-sizing: border-box; 
            text-align: center; 
            font-family: 'Georgia', serif;
            position: relative;
            overflow: hidden;
        ">
            <!-- Background Pattern -->
            <div style="
                position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: 
                    radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.05) 0%, transparent 50%);
                pointer-events: none;
            "></div>
            
            <!-- Header Section -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; position: relative; z-index: 1;">
                <!-- Company Logo -->
                <div style="display: flex; align-items: center;">
                    <img src="img/logo.png" 
                         style="height: 60px; width: auto; object-fit: contain;"
                         alt="VoltNexis Learn Logo"/>
                </div>
                
                <!-- Course Image -->
                <div style="
                    width: 140px; height: 90px; 
                    border-radius: 12px; 
                    border: 3px solid #667eea;
                    overflow: hidden;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    display: flex; align-items: center; justify-content: center;
                ">
                    <img src="${courseImageUrl}" 
                         style="width: 100%; height: 100%; object-fit: cover;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/>
                    <div style="color: white; font-size: 24px; display: none; align-items: center; justify-content: center; width: 100%; height: 100%;">🎓</div>
                </div>
            </div>
            
            <!-- Certificate Title -->
            <div style="margin: 40px 0; position: relative; z-index: 1;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 10px;">
                    <h1 style="
                        font-size: 42px; 
                        color: #1f2937; 
                        margin: 0; 
                        font-family: 'Georgia', serif;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                        letter-spacing: 2px;
                    ">Certificate of Achievement</h1>
                </div>
                <div style="
                    width: 200px; height: 4px; 
                    background: linear-gradient(135deg, #667eea, #764ba2); 
                    margin: 20px auto;
                    border-radius: 2px;
                "></div>
            </div>
            
            <!-- Main Content -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; margin: 50px 0; position: relative; z-index: 1;">
                <p style="font-size: 18px; color: #4b5563; margin: 15px 0; font-style: italic;">This is to certify that</p>
                
                <h2 style="
                    font-size: 36px; 
                    color: #1f2937; 
                    margin: 25px 0; 
                    font-family: 'Georgia', serif; 
                    text-decoration: underline; 
                    text-decoration-color: #667eea;
                    text-decoration-thickness: 3px;
                    text-underline-offset: 8px;
                ">${userName}</h2>
                
                <p style="font-size: 18px; color: #4b5563; margin: 15px 0; font-style: italic;">has successfully completed the course</p>
                
                <h3 style="
                    font-size: 28px; 
                    color: #667eea; 
                    margin: 25px 0; 
                    font-weight: bold;
                    line-height: 1.3;
                ">${course.title}</h3>
                <div style="
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        padding: 8px 16px;
                        width: 150px;
                        border-radius: 20px;
                        text-align: center;
                        margin: 10px auto 20px auto;
                        font-size: 16px;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    ">FREE COURSE</div>
                
                <div style="
                    background: rgba(102, 126, 234, 0.1);
                    padding: 20px;
                    border-radius: 12px;
                    margin: 20px auto;
                    max-width: 600px;
                    border: 1px solid rgba(102, 126, 234, 0.2);
                ">
                    <p style="font-size: 16px; color: #374151; margin: 5px 0; font-weight: 600;">${course.category}</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 5px 0; font-style: italic;">Instructor: ${course.owner || 'VoltNexis Learn'}</p>
                </div>
                
                <!-- Course Details -->
                <div style="
                    display: flex; 
                    justify-content: center; 
                    gap: 50px; 
                    margin: 30px 0; 
                    flex-wrap: wrap;
                ">
                    <div style="
                        display: flex; 
                        align-items: center; 
                        gap: 8px; 
                        font-size: 16px; 
                        color: #374151;
                        background: white;
                        padding: 12px 20px;
                        border-radius: 25px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        border: 1px solid #e5e7eb;
                    ">
                        <span style="font-size: 18px;">📅</span>
                        <span>Completed: <strong style="color: #1f2937;">${completionDate}</strong></span>
                    </div>
                    <div style="
                        display: flex; 
                        align-items: center; 
                        gap: 8px; 
                        font-size: 16px; 
                        color: #374151;
                        background: white;
                        padding: 12px 20px;
                        border-radius: 25px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        border: 1px solid #e5e7eb;
                    ">
                        <span style="font-size: 18px;">⏱️</span>
                        <span>Duration: <strong style="color: #1f2937;">${course.duration_text || 'Self-paced'}</strong></span>
                    </div>
                </div>
            </div>
            
            <!-- Footer Section -->
            <div style="
                display: flex; 
                justify-content: space-between; 
                align-items: end; 
                margin-top: 40px;
                position: relative;
                z-index: 1;
            ">
                <!-- Signature -->
                <div style="text-align: center;">
                    <div style="
                        width: 200px; 
                        height: 2px; 
                        background: #1f2937; 
                        margin-bottom: 8px;
                    "></div>
                    <p style="font-size: 14px; color: #4b5563; margin: 0; font-weight: 600;">Director</p>
                    <img src="img/logo.png" style="height: 20px; width: auto; object-fit: contain; margin-top: 5px;" alt="VoltNexis Learn"/>
                </div>
                
                <!-- Verification Badge -->
                <div style="text-align: center; color: #667eea;">
                    <div style="
                        font-size: 40px; 
                        margin-bottom: 8px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    ">🏆</div>
                    <span style="
                        font-size: 12px; 
                        text-transform: uppercase; 
                        letter-spacing: 2px;
                        font-weight: bold;
                    ">Verified Certificate</span>
                </div>
                
                <!-- Free Platform Notice -->
                <div style="text-align: center;">
                    <div style="
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    ">✨ Using Free</div>
                    <p style="font-size: 10px; color: #6b7280; margin: 5px 0 0 0;">Free Online Learning</p>
                </div>
            </div>
            
            <!-- Certificate ID -->
            <div style="
                position: absolute;
                bottom: 15px;
                right: 20px;
                font-size: 10px;
                color: #9ca3af;
                font-family: monospace;
            ">ID: VNLC-${courseId.slice(-8).toUpperCase()}</div>
        </div>
    `;
    
    document.body.appendChild(tempCert);
    
    // Generate PDF using html2canvas and jsPDF
    html2canvas(tempCert, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 850
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'mm', 'a4');
        
        const pdfWidth = 297;
        const pdfHeight = 210;
        const imgWidth = pdfWidth - 10;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const xOffset = 5;
        const yOffset = imgHeight < pdfHeight ? (pdfHeight - imgHeight) / 2 : 5;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, Math.min(imgHeight, pdfHeight - 10));
        
        const fileName = `VoltNexis_${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`;
        pdf.save(fileName);
        
        document.body.removeChild(tempCert);
        showSuccess(`Certificate for "${course.title}" downloaded successfully!`);
    }).catch(error => {
        console.error('Error generating PDF:', error);
        document.body.removeChild(tempCert);
        showError('Failed to generate certificate PDF');
    });
};

// Share certificate
function shareCertificateLink(courseId) {
    const cert = userCertificates.find(c => c.course_id === courseId);
    if (cert) {
        const course = cert.courses;
        const shareText = `I just completed "${course.title}" on VoltNexis Learn! 🎓`;
        const shareUrl = `${window.location.origin}/certificate/${courseId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'VoltNexis Learn Certificate',
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
                showSuccess('Certificate link copied to clipboard!');
            });
        }
    }
};

// View toggle functionality
function initViewToggle() {
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderCertificates();
        });
    });
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>${message}</p>
    `;
    document.querySelector('.main-content').prepend(successDiv);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
    `;
    document.querySelector('.main-content').prepend(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Mobile menu
function initMobileMenu() {
    sidebarToggle?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    });
    
    mobileOverlay?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('active');
        mobileOverlay.classList.remove('active');
    });
}

// Modal event listeners
modalClose?.addEventListener('click', closeCertificateModal);
certificateModal?.addEventListener('click', (e) => {
    if (e.target === certificateModal) {
        closeCertificateModal();
    }
});

downloadCertificate?.addEventListener('click', () => {
    if (selectedCertificate) {
        downloadCertificatePDF(selectedCertificate.course_id);
        closeCertificateModal();
    }
});

shareCertificate?.addEventListener('click', () => {
    if (selectedCertificate) {
        shareCertificateLink(selectedCertificate.course_id);
        closeCertificateModal();
    }
});

// Logout functionality
logoutBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("userPhone");
        localStorage.removeItem("userName");
        window.location.href = "index.html";
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !certificateModal.classList.contains('hidden')) {
        closeCertificateModal();
    }
});

// Recognition button functionality
recognitionBtn?.addEventListener("click", () => {
    const message = "I want to be recognised by VoltNexis brand name";
    const telegramUrl = `https://t.me/voltnexis?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
});

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    if (checkAuth()) {
        initViewToggle();
        initMobileMenu();
        await loadCertificates();
    }
});
