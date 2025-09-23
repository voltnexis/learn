import { supabase } from "./supabase.js";
import "./loading.js";

const coursesContainer = document.getElementById("coursesContainer");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const languageSelect = document.getElementById("languageSelect");
const logoutBtn = document.getElementById("logoutBtn");
const profileName = document.getElementById("profileName");
const totalCoursesEl = document.getElementById("totalCourses");
const sidebarToggle = document.getElementById("sidebarToggle");
const mobileOverlay = document.getElementById("mobileOverlay");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const moreFiltersBtn = document.getElementById("moreFiltersBtn");
const viewButtons = document.querySelectorAll(".view-btn");
const recognitionBtn = document.getElementById("recognitionBtn");

let allCourses = [];
let currentView = 'grid';

// Check if user is logged in
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

// Mobile sidebar toggle
function initMobileMenu() {
    const toggleSidebar = () => {
        document.querySelector('.sidebar').classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    };
    
    sidebarToggle?.addEventListener('click', toggleSidebar);
    mobileMenuBtn?.addEventListener('click', toggleSidebar);
    
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

// Logout functionality
logoutBtn?.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("userPhone");
        localStorage.removeItem("userName");
        window.location.href = "index.html";
    }
});

// Fetch courses from Supabase
async function loadCourses() {
    try {
        // Show skeleton loading
        window.LoadingManager.showSkeleton('coursesContainer', 'cards');
        
        const { data, error } = await supabase.from("courses").select("*");
        if (error) throw error;
        
        // Simulate minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        allCourses = data || [];
        updateHeroStats();
        renderCourses();
    } catch (error) {
        console.error("Error fetching courses:", error);
        coursesContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load courses</h3>
                <p>Please check your connection and try again</p>
                <button onclick="location.reload()" class="btn-primary">Retry</button>
            </div>
        `;
    }
}

// Render courses based on filters and search text
function renderCourses(filterCategory = "all", searchText = "", lang = "all") {
    coursesContainer.innerHTML = "";
    
    if (!allCourses.length) {
        coursesContainer.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>No courses available</p></div>';
        return;
    }
    
    const filtered = allCourses.filter(course => {
        const matchCategory = filterCategory === "all" || course.category === filterCategory;
        const matchSearch = course.title.toLowerCase().includes(searchText.toLowerCase());
        const matchLang = lang === "all" || (course.language && course.language.toLowerCase() === lang.toLowerCase());
        return matchCategory && matchSearch && matchLang;
    });

    if (!filtered.length) {
        coursesContainer.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No courses match your criteria</p></div>';
        return;
    }

    filtered.forEach(course => {
        const card = document.createElement("a");
        card.href = `course.html?id=${course.id}`;
        card.className = "course-card";
        
        const cardContent = currentView === 'grid' ? `
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
                <div class="course-owner">
                    <a href="owner.html?name=${encodeURIComponent(course.owner || 'Unknown')}" class="owner-link" onclick="event.stopPropagation()">
                        <i class="fas fa-user"></i> ${course.owner || 'Unknown'}
                    </a>
                </div>
                <div class="course-meta">
                    <span class="duration"><i class="fas fa-clock"></i> ${course.duration_text || 'N/A'}</span>
                    <span class="language"><i class="fas fa-globe"></i> ${course.language || 'English'}</span>
                </div>
                <div class="course-footer">
                    <span class="course-price">Free</span>
                    <span class="course-rating">
                        <i class="fas fa-star"></i> 4.8
                    </span>
                </div>
            </div>
        ` : `
            <div class="course-image-list">
                <img src="https://img.youtube.com/vi/${course.youtube_thumbnail_id}/maxresdefault.jpg" 
                     alt="${course.title}"
                     onerror="this.src='../img/${course.title}.png'">
            </div>
            <div class="course-content-list">
                <div class="course-header">
                    <span class="course-category">${course.category}</span>
                    <span class="course-price">Free</span>
                </div>
                <h3 class="course-title">${course.title}</h3>
                <div class="course-owner-list">
                    <a href="owner.html?name=${encodeURIComponent(course.owner || 'Unknown')}" class="owner-link" onclick="event.stopPropagation()">
                        <i class="fas fa-user"></i> ${course.owner || 'Unknown'}
                    </a>
                </div>
                <div class="course-meta">
                    <span><i class="fas fa-clock"></i> ${course.duration_text || 'N/A'}</span>
                    <span><i class="fas fa-globe"></i> ${course.language || 'English'}</span>
                    <span><i class="fas fa-star"></i> 4.8</span>
                </div>
            </div>
        `;
        
        card.innerHTML = cardContent;
        coursesContainer.appendChild(card);
    });
    
    // Update total courses count
    if (totalCoursesEl) {
        totalCoursesEl.textContent = allCourses.length;
    }
}

// Event Listeners
filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderCourses(btn.dataset.category, searchInput.value, languageSelect.value);
    });
});

searchInput.addEventListener("input", () => {
    renderCourses(document.querySelector(".filter-btn.active").dataset.category, searchInput.value, languageSelect.value);
});

languageSelect.addEventListener("change", () => {
    renderCourses(document.querySelector(".filter-btn.active").dataset.category, searchInput.value, languageSelect.value);
});

// Search with debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSearch = debounce(() => {
    renderCourses(
        document.querySelector(".filter-btn.active").dataset.category,
        searchInput.value,
        languageSelect.value
    );
}, 300);

// Update search event listener
searchInput?.addEventListener("input", debouncedSearch);

// Recognition button functionality
recognitionBtn?.addEventListener("click", () => {
    const message = "I want to be recognised by VoltNexis brand name";
    const telegramUrl = `https://t.me/voltnexis?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
});

// More filters button functionality
moreFiltersBtn?.addEventListener("click", () => {
    const filterButtons = document.querySelector('.filter-buttons');
    filterButtons.classList.toggle('expanded');
    
    if (filterButtons.classList.contains('expanded')) {
        moreFiltersBtn.innerHTML = '<i class="fas fa-times"></i> Less';
    } else {
        moreFiltersBtn.innerHTML = '<i class="fas fa-ellipsis-h"></i> More';
    }
});

// Update language selector text for mobile
function updateLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    const allOption = languageSelect.querySelector('option[value="all"]');
    
    if (window.innerWidth <= 768) {
        allOption.textContent = 'All';
    } else {
        allOption.textContent = 'All Languages';
    }
}

// Update on resize
window.addEventListener('resize', updateLanguageSelector);

// Initial load
document.addEventListener("DOMContentLoaded", async () => {
    if (checkAuth()) {
        // Show initial loading
        window.LoadingManager.show('Initializing dashboard...', 'init');
        
        try {
            initMobileMenu();
            initViewToggle();
            updateLanguageSelector();
            
            // Load user data and courses
            await Promise.all([
                loadUserData(),
                loadCourses()
            ]);
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
        } finally {
            window.LoadingManager.hide('init');
        }
    }
});

// Update hero stats
function updateHeroStats() {
    if (totalCoursesEl) {
        totalCoursesEl.textContent = allCourses.length;
    }
}

// Load user data
async function loadUserData() {
    try {
        const userPhone = localStorage.getItem("userPhone");
        if (!userPhone) return;
        
        const { data, error } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("phone", userPhone)
            .single();
            
        if (data && profileName) {
            const fullName = `${data.first_name} ${data.last_name}`;
            profileName.textContent = fullName;
            localStorage.setItem("userName", fullName);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}
