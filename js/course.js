import { supabase } from "./supabase.js";
import "./loading.js";

// DOM Elements
const courseOverview = document.getElementById("courseOverview");
const coursePlayer = document.getElementById("coursePlayer");
const startLearningBtn = document.getElementById("startLearningBtn");
const backToOverview = document.getElementById("backToOverview");
const certificateBtn = document.getElementById("certificateBtn");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// Course info elements
const courseTitleEl = document.getElementById("courseTitle");
const sidebarCourseTitleEl = document.getElementById("sidebarCourseTitle");
const courseThumbnail = document.getElementById("courseThumbnail");
const courseCategoryBadge = document.getElementById("courseCategoryBadge");
const courseDuration = document.getElementById("courseDuration");
const courseLessonsCount = document.getElementById("courseLessonsCount");
const courseLearningPoints = document.getElementById("courseLearningPoints");
const courseDescriptionEl = document.getElementById("courseDescription");

// Video player elements
const lessonList = document.getElementById("lessonList");
const videoPlayer = document.getElementById("videoPlayer");
const currentLessonTitle = document.getElementById("currentLessonTitle");
const lessonTitleEl = document.getElementById("lessonTitle");
const lessonDescriptionEl = document.getElementById("lessonDescription");
const completeLessonBtn = document.getElementById("completeLessonBtn");
const incompleteLessonBtn = document.getElementById("incompleteLessonBtn");
const prevLessonBtn = document.getElementById("prevLessonBtn");
const nextLessonBtn = document.getElementById("nextLessonBtn");

// Progress elements
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// Global variables for course and user data
let lessons = [];
let completedLessons = new Set();
let currentCourse = null;
let currentUser = {
    phone: localStorage.getItem("userPhone"),
    firstName: null,
    lastName: null
};
let currentLessonId = null;

// Get course ID from URL
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get("id");

// Check authentication
function checkAuth() {
    const userPhone = localStorage.getItem("userPhone");
    if (!userPhone) {
        alert("Please login to access courses");
        window.location.href = "index.html";
        return false;
    }
    return true;
}

// ✅ Fetch User Data and Course Data
async function loadInitialData() {
    if (!checkAuth()) return;
    
    if (!courseId) {
        alert("Invalid course ID");
        window.location.href = "dashboard.html";
        return;
    }
    try {
        window.LoadingManager.show('Loading course data...', 'course-init');
        // 1. Fetch User Data
        if (currentUser.phone) {
            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("first_name, last_name")
                .eq("phone", currentUser.phone)
                .single();

            if (userError) {
                console.error("Error fetching user data:", userError);
            } else {
                currentUser.firstName = userData.first_name;
                currentUser.lastName = userData.last_name;
            }
        } else {
            console.warn("User phone not found in localStorage. User may not be logged in.");
            return;
        }

        // 2. Fetch Course Data
        let { data: courseData, error: courseError } = await supabase
            .from("courses")
            .select("*, lessons(*)")
            .eq("id", courseId)
            .single();

        if (courseError) {
            console.error("Error fetching course data:", courseError);
            alert("Course not found");
            window.location.href = "dashboard.html";
            return;
        }

        currentCourse = courseData;
        lessons = currentCourse.lessons ? currentCourse.lessons.sort((a, b) => a.order - b.order) : [];

        // 3. Fetch Existing Progress for this User and Course
        const { data: progressData, error: progressError } = await supabase
            .from("progress")
            .select("completed_lessons_ids")
            .eq("user_phone", currentUser.phone)
            .eq("course_id", courseId)
            .single();

        if (progressError && progressError.code !== "PGRST116") {
            console.error("Error fetching user progress:", progressError);
        } else if (progressData && progressData.completed_lessons_ids) {
            try {
                const storedIds = JSON.parse(progressData.completed_lessons_ids);
                completedLessons = new Set(storedIds);
            } catch (e) {
                console.error("Failed to parse completed_lessons_ids from Supabase:", e);
                completedLessons = new Set();
            }
        }

        // Set course thumbnail
        const thumbnailId = currentCourse.youtube_thumbnail_id || (lessons[0] && lessons[0].youtube_id);
        if (thumbnailId) {
            courseThumbnail.src = `https://img.youtube.com/vi/${thumbnailId}/maxresdefault.jpg`;
        } else {
            courseThumbnail.src = currentCourse.img || 'https://via.placeholder.com/400x250/1a1a1a/ffffff?text=Course+Preview';
        }

        // Set course info
        const title = currentCourse.title || 'Course Title';
        courseTitleEl.textContent = title;
        sidebarCourseTitleEl.textContent = title;
        courseCategoryBadge.textContent = currentCourse.category || 'Course';
        
        courseDuration.textContent = currentCourse.duration_text || "N/A";
        courseLessonsCount.textContent = `${lessons.length} lessons`;
        courseDescriptionEl.textContent = currentCourse.description || 'No description available';

        // Set learning points
        courseLearningPoints.innerHTML = "";
        if (Array.isArray(currentCourse.learning_points) && currentCourse.learning_points.length > 0) {
            currentCourse.learning_points.forEach(point => {
                const li = document.createElement("li");
                li.textContent = point;
                courseLearningPoints.appendChild(li);
            });
        } else {
            const defaultPoints = [
                "Master the fundamentals",
                "Build practical projects",
                "Get hands-on experience",
                "Earn a certificate"
            ];
            defaultPoints.forEach(point => {
                const li = document.createElement("li");
                li.textContent = point;
                courseLearningPoints.appendChild(li);
            });
        }

        renderLessons();
        updateProgress();
    } catch (error) {
        console.error("Error loading course data:", error);
        alert("Failed to load course. Please try again.");
        window.location.href = "dashboard.html";
    } finally {
        window.LoadingManager.hide('course-init');
    }
}

// Render Lessons in Sidebar
function renderLessons() {
    lessonList.innerHTML = "";
    lessons.forEach((lesson, index) => {
        const lessonItem = document.createElement("div");
        lessonItem.className = `lesson-item ${currentLessonId === lesson.id ? 'active' : ''}`;
        
        lessonItem.innerHTML = `
            <img src="https://img.youtube.com/vi/${lesson.youtube_id}/mqdefault.jpg" 
                 class="lesson-thumbnail" 
                 alt="${lesson.title}" 
                 onerror="this.src='https://via.placeholder.com/60x40/1a1a1a/ffffff?text=${index + 1}'">
            <div class="lesson-content">
                <div class="lesson-title">${lesson.title}</div>
                <div class="lesson-duration">${lesson.duration || '5 min'}</div>
            </div>
            <div class="lesson-status">
                ${completedLessons.has(lesson.id) ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `;
        
        lessonItem.addEventListener("click", () => loadLesson(lesson.id));
        lessonList.appendChild(lessonItem);
    });
}

// Load Selected Lesson
function loadLesson(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) {
        console.error("Lesson not found:", lessonId);
        return;
    }
    
    currentLessonId = lessonId;
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    
    // Update video player
    if (lesson.youtube_id) {
        videoPlayer.src = `https://www.youtube.com/embed/${lesson.youtube_id}?autoplay=1&controls=1&rel=0&modestbranding=1`;
    } else {
        videoPlayer.src = "";
        console.warn("No YouTube ID found for lesson:", lesson.title);
    }
    
    // Update lesson info
    const title = lesson.title || 'Lesson Title';
    lessonTitleEl.textContent = title;
    currentLessonTitle.textContent = title;
    lessonDescriptionEl.textContent = lesson.description || 'No description available';

    // Update lesson action buttons
    if (completedLessons.has(currentLessonId)) {
        completeLessonBtn.classList.add("hidden");
        incompleteLessonBtn.classList.remove("hidden");
    } else {
        completeLessonBtn.classList.remove("hidden");
        incompleteLessonBtn.classList.add("hidden");
    }
    
    // Update navigation buttons
    prevLessonBtn.disabled = currentIndex === 0;
    nextLessonBtn.disabled = currentIndex === lessons.length - 1;

    renderLessons();
}

// Lesson completion handlers
completeLessonBtn?.addEventListener("click", () => {
    if (!currentLessonId) return;
    if (!completedLessons.has(currentLessonId)) {
        completedLessons.add(currentLessonId);
        updateProgress();
        renderLessons();
        completeLessonBtn.classList.add("hidden");
        incompleteLessonBtn.classList.remove("hidden");
        
        // Auto-advance to next lesson if available
        const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
        if (currentIndex < lessons.length - 1) {
            setTimeout(() => {
                if (confirm("Great! Ready for the next lesson?")) {
                    loadLesson(lessons[currentIndex + 1].id);
                }
            }, 1000);
        }
    }
});

incompleteLessonBtn?.addEventListener("click", () => {
    if (!currentLessonId) return;
    if (completedLessons.has(currentLessonId)) {
        completedLessons.delete(currentLessonId);
        updateProgress();
        renderLessons();
        incompleteLessonBtn.classList.add("hidden");
        completeLessonBtn.classList.remove("hidden");
    }
});

// Certificate button handler
certificateBtn?.addEventListener("click", () => {
    alert("Congratulations! Your certificate is being generated. Check your email shortly.");
    window.location.href = "dashboard.html";
});

// ✅ Update Progress (and save to Supabase)
async function updateProgress() {
    const totalLessons = lessons.length;
    const completedCount = completedLessons.size;
    const percent = totalLessons > 0 ? Math.floor((completedCount / totalLessons) * 100) : 0;
    
    progressBar.style.width = percent + "%";
    progressText.textContent = `${percent}% Complete`;

    if (percent >= 100) {
        certificateBtn.classList.remove("hidden");
    } else {
        certificateBtn.classList.add("hidden");
    }

    if (currentUser.phone && currentCourse) {
        // Build the data object to be saved, including only non-null values
        const dataToSave = {
            user_phone: currentUser.phone,
            course_id: currentCourse.id,
            course_title: currentCourse.title,
            progress_percentage: percent,
            completed_lessons_ids: JSON.stringify(Array.from(completedLessons))
        };
        // Add name fields only if they are not null
        if (currentUser.firstName) {
            dataToSave.user_first_name = currentUser.firstName;
        }
        if (currentUser.lastName) {
            dataToSave.user_last_name = currentUser.lastName;
        }

        // Log the data to be sure
        console.log("Saving this data to Supabase:", dataToSave);

        const { error } = await supabase
            .from("progress")
            .upsert(dataToSave, {
                onConflict: "user_phone, course_id"
            });

        if (error) {
            console.error("Error saving progress to Supabase:", error);
        } else {
            console.log("Progress saved successfully!");
        }
    }
}

// Event Listeners
startLearningBtn?.addEventListener("click", () => {
    if (lessons.length === 0) {
        alert("No lessons available for this course yet.");
        return;
    }
    
    courseOverview.classList.add("hidden");
    coursePlayer.classList.remove("hidden");
    loadLesson(lessons[0].id);
});

backToOverview?.addEventListener("click", () => {
    coursePlayer.classList.add("hidden");
    courseOverview.classList.remove("hidden");
});

// Navigation buttons
prevLessonBtn?.addEventListener("click", () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex > 0) {
        loadLesson(lessons[currentIndex - 1].id);
    }
});

nextLessonBtn?.addEventListener("click", () => {
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex < lessons.length - 1) {
        loadLesson(lessons[currentIndex + 1].id);
    }
});

// Mobile sidebar toggle
sidebarToggle?.addEventListener("click", () => {
    document.querySelector('.course-sidebar').classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

sidebarOverlay?.addEventListener("click", () => {
    document.querySelector('.course-sidebar').classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

// Initialize the course page
document.addEventListener("DOMContentLoaded", () => {
    loadInitialData();
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
    if (!currentLessonId || lessons.length === 0) return;
    
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    
    if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        loadLesson(lessons[currentIndex - 1].id);
    } else if (e.key === "ArrowRight" && currentIndex < lessons.length - 1) {
        e.preventDefault();
        loadLesson(lessons[currentIndex + 1].id);
    } else if (e.key === "Escape" && !coursePlayer.classList.contains('hidden')) {
        e.preventDefault();
        coursePlayer.classList.add("hidden");
        courseOverview.classList.remove("hidden");
    }
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelector('.course-sidebar')?.classList.remove('active');
        sidebarOverlay?.classList.remove('active');
    }
});
