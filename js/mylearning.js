import { supabase } from "./supabase.js";
import "./loading.js";

// DOM Elements
const profileName = document.getElementById("profileName");
const logoutBtn = document.getElementById("logoutBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileOverlay = document.getElementById("mobileOverlay");
const enrolledCount = document.getElementById("enrolledCount");
const completedCount = document.getElementById("completedCount");
const recognitionBtn = document.getElementById("recognitionBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const inProgressCourses = document.getElementById("inProgressCourses");
const completedCourses = document.getElementById("completedCourses");
const bookmarkedCourses = document.getElementById("bookmarkedCourses");

let userProgress = [];
let allCourses = [];

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

// Load user progress and courses
async function loadUserProgress() {
    try {
        window.LoadingManager.show('Loading your learning progress...', 'progress');
        
        const userPhone = localStorage.getItem("userPhone");
        
        // Show skeleton for each section
        window.LoadingManager.showSkeleton('inProgressCourses', 'cards');
        window.LoadingManager.showSkeleton('completedCourses', 'cards');
        window.LoadingManager.showSkeleton('bookmarkedCourses', 'cards');
        
        // Fetch user progress and courses in parallel
        const [progressResult, coursesResult] = await Promise.all([
            supabase.from("progress").select("*").eq("user_phone", userPhone),
            supabase.from("courses").select("*")
        ]);
        
        if (progressResult.error) throw progressResult.error;
        if (coursesResult.error) throw coursesResult.error;
        
        userProgress = progressResult.data || [];
        allCourses = coursesResult.data || [];
        
        // Simulate minimum loading time
        await new Promise(resolve => setTimeout(resolve, 600));
        
        updateStats();
        renderCourses();
        
    } catch (error) {
        console.error("Error loading user progress:", error);
        showError("Failed to load your learning progress");
    } finally {
        window.LoadingManager.hide('progress');
    }
}

// Update statistics
function updateStats() {
    const enrolled = userProgress.length;
    const completed = userProgress.filter(p => p.progress_percentage >= 100).length;
    
    enrolledCount.textContent = enrolled;
    completedCount.textContent = completed;
}

// Render courses based on tab
function renderCourses() {
    renderInProgressCourses();
    renderCompletedCourses();
    renderBookmarkedCourses();
}

// Render in-progress courses
function renderInProgressCourses() {
    const inProgress = userProgress.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100);
    
    if (inProgress.length === 0) {
        inProgressCourses.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-play-circle"></i>
                <h3>No courses in progress</h3>
                <p>Start learning by enrolling in a course</p>
                <a href="dashboard.html" class="btn-primary">Browse Courses</a>
            </div>
        `;
        return;
    }
    
    inProgressCourses.innerHTML = inProgress.map(progress => {
        const course = allCourses.find(c => c.id === progress.course_id);
        if (!course) return '';
        
        return `
            <div class="learning-card">
                <div class="course-thumbnail">
                    <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                         alt="${course.title}" 
                         onerror="this.src='https://via.placeholder.com/300x200/1a1a1a/ffffff?text=Course'">
                    <div class="progress-overlay">
                        <div class="progress-circle">
                            <span>${progress.progress_percentage}%</span>
                        </div>
                    </div>
                </div>
                <div class="course-info">
                    <div class="course-category">${course.category}</div>
                    <h3>${course.title}</h3>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progress.progress_percentage}%"></div>
                    </div>
                    <div class="course-meta">
                        <span><i class="fas fa-clock"></i> ${course.duration_text || 'N/A'}</span>
                        <span><i class="fas fa-play-circle"></i> Continue Learning</span>
                    </div>
                    <div class="course-actions">
                        <a href="course.html?id=${course.id}" class="btn-primary">Continue</a>
                        <button class="btn-secondary" onclick="bookmarkCourse(${course.id})">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render completed courses
function renderCompletedCourses() {
    const completed = userProgress.filter(p => p.progress_percentage >= 100);
    
    if (completed.length === 0) {
        completedCourses.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No completed courses yet</h3>
                <p>Complete your first course to see it here</p>
                <a href="dashboard.html" class="btn-primary">Start Learning</a>
            </div>
        `;
        return;
    }
    
    completedCourses.innerHTML = completed.map(progress => {
        const course = allCourses.find(c => c.id === progress.course_id);
        if (!course) return '';
        
        return `
            <div class="learning-card completed">
                <div class="course-thumbnail">
                    <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                         alt="${course.title}"
                         onerror="this.src='https://via.placeholder.com/300x200/1a1a1a/ffffff?text=Course'">
                    <div class="completion-badge">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
                <div class="course-info">
                    <div class="course-category">${course.category}</div>
                    <h3>${course.title}</h3>
                    <div class="completion-info">
                        <span><i class="fas fa-calendar"></i> Completed</span>
                        <span><i class="fas fa-certificate"></i> Certificate Available</span>
                    </div>
                    <div class="course-actions">
                        <a href="course.html?id=${course.id}" class="btn-secondary">Review</a>
                        <a href="certificates.html" class="btn-primary">Get Certificate</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render bookmarked courses (placeholder)
function renderBookmarkedCourses() {
    bookmarkedCourses.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-bookmark"></i>
            <h3>No bookmarked courses</h3>
            <p>Bookmark courses to save them for later</p>
            <a href="dashboard.html" class="btn-primary">Browse Courses</a>
        </div>
    `;
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

// Tab switching
function initTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
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

// Logout functionality
logoutBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("userPhone");
        localStorage.removeItem("userName");
        window.location.href = "index.html";
    }
});

// Bookmark course (placeholder function)
window.bookmarkCourse = function(courseId) {
    alert("Bookmark functionality coming soon!");
};

// Recognition button functionality
recognitionBtn?.addEventListener("click", () => {
    const message = "I want to be recognised by VoltNexis brand name";
    const telegramUrl = `https://t.me/voltnexis?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
});

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    if (checkAuth()) {
        initTabs();
        initMobileMenu();
        await loadUserProgress();
    }
});