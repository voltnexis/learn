import { supabase } from "./supabase.js";
import "./loading.js";

const coursesContainer = document.getElementById("coursesContainer");
const logoutBtn = document.getElementById("logoutBtn");
const profileName = document.getElementById("profileName");
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileOverlay = document.getElementById("mobileOverlay");
const viewButtons = document.querySelectorAll(".view-btn");
const ownerTitle = document.getElementById("ownerTitle");
const ownerDescription = document.getElementById("ownerDescription");
const courseCount = document.getElementById("courseCount");
const coursesTitle = document.getElementById("coursesTitle");
const recognitionBtn = document.getElementById("recognitionBtn");

let ownerCourses = [];
let currentView = 'grid';
let ownerName = '';

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

// Get owner name from URL
function getOwnerFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('name') || 'Unknown';
}

// Mobile sidebar toggle
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

// View toggle functionality
function initViewToggle() {
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            coursesContainer.className = `courses-${currentView}`;
            renderCourses();
        });
    });
}

// Load courses by owner
async function loadOwnerCourses() {
    try {
        window.LoadingManager.show('Loading courses...', 'owner');
        window.LoadingManager.showSkeleton('coursesContainer', 'cards');
        
        const { data, error } = await supabase
            .from("courses")
            .select("*")
            .eq("owner", ownerName);
            
        if (error) throw error;
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        ownerCourses = data || [];
        updatePageContent();
        renderCourses();
        
    } catch (error) {
        console.error("Error loading owner courses:", error);
        coursesContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load courses</h3>
                <p>Please check your connection and try again</p>
                <button onclick="location.reload()" class="btn-primary">Retry</button>
            </div>
        `;
    } finally {
        window.LoadingManager.hide('owner');
    }
}

// Update page content with owner info
function updatePageContent() {
    const count = ownerCourses.length;
    ownerTitle.textContent = `${ownerName}'s Courses`;
    ownerDescription.textContent = `Explore all ${count} course${count !== 1 ? 's' : ''} by ${ownerName}`;
    courseCount.textContent = count;
    coursesTitle.textContent = `${count} Course${count !== 1 ? 's' : ''} by ${ownerName}`;
    document.title = `${ownerName} - VoltNexis Learn`;
}

// Render courses
function renderCourses() {
    if (ownerCourses.length === 0) {
        coursesContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No courses found</h3>
                <p>${ownerName} hasn't published any courses yet</p>
                <a href="dashboard.html" class="btn-primary">Browse All Courses</a>
            </div>
        `;
        return;
    }
    
    coursesContainer.innerHTML = ownerCourses.map(course => {
        if (currentView === 'grid') {
            return `
                <a href="course.html?id=${course.id}" class="course-card">
                    <div class="course-image">
                        <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                             alt="${course.title}" 
                             onerror="this.src='https://via.placeholder.com/300x200/1a1a1a/ffffff?text=Course'">
                        <div class="course-overlay">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    <div class="course-content">
                        <div class="course-category">${course.category}</div>
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-meta">
                            <span class="duration"><i class="fas fa-clock"></i> ${course.duration_text || 'N/A'}</span>
                            <span class="language"><i class="fas fa-globe"></i> ${course.lang || 'English'}</span>
                        </div>
                        <div class="course-footer">
                            <span class="course-price">Free</span>
                            <span class="course-rating">
                                <i class="fas fa-star"></i> 4.8
                            </span>
                        </div>
                    </div>
                </a>
            `;
        } else {
            return `
                <a href="course.html?id=${course.id}" class="course-list-item">
                    <div class="course-image-list">
                        <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                             alt="${course.title}"
                             onerror="this.src='https://via.placeholder.com/120x80/1a1a1a/ffffff?text=Course'">
                    </div>
                    <div class="course-content-list">
                        <div class="course-header">
                            <span class="course-category">${course.category}</span>
                            <span class="course-price">Free</span>
                        </div>
                        <h3 class="course-title">${course.title}</h3>
                        <div class="course-meta">
                            <span><i class="fas fa-clock"></i> ${course.duration_text || 'N/A'}</span>
                            <span><i class="fas fa-globe"></i> ${course.lang || 'English'}</span>
                            <span><i class="fas fa-star"></i> 4.8</span>
                        </div>
                    </div>
                </a>
            `;
        }
    }).join('');
}

// Logout functionality
logoutBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("userPhone");
        localStorage.removeItem("userName");
        window.location.href = "index.html";
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
        ownerName = getOwnerFromURL();
        
        if (!ownerName || ownerName === 'Unknown') {
            window.location.href = "dashboard.html";
            return;
        }
        
        initMobileMenu();
        initViewToggle();
        await loadOwnerCourses();
    }
});