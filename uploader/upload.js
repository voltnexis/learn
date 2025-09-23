import { supabase } from '../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('course-upload-form');
    const addLessonBtn = document.getElementById('add-lesson');
    const previewBtn = document.getElementById('preview-btn');

    const previewModal = document.getElementById('preview-modal');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Add lesson functionality
    addLessonBtn.addEventListener('click', () => {
        const container = document.getElementById('lessons-container');
        const lessonCount = container.children.length + 1;
        
        const lessonItem = document.createElement('div');
        lessonItem.className = 'lesson-item';
        lessonItem.innerHTML = `
            <input type="text" placeholder="Lesson ${lessonCount} Title" class="lesson-title" required>
            <textarea placeholder="Lesson ${lessonCount} Description" class="lesson-description" rows="2" required></textarea>
            <input type="url" placeholder="YouTube URL" class="lesson-url" required>
            <input type="number" placeholder="Duration (minutes)" class="lesson-duration" min="1" required>
            <button type="button" class="remove-lesson" onclick="removeLesson(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(lessonItem);
    });



    // Preview functionality
    previewBtn.addEventListener('click', () => {
        const formData = collectFormData();
        if (formData) {
            showPreview(formData);
        }
    });

    // Close modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        previewModal.classList.add('hidden');
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await uploadCourse();
    });

    function collectFormData() {
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const language = document.getElementById('language').value;
        const learningPointsRaw = document.getElementById('learning-points').value.trim();
        const learningPoints = formatLearningPoints(learningPointsRaw);
        const owner = document.getElementById('owner').value.trim();

        // Validate required fields
        if (!title || !description || !category || !language || !learningPoints || !owner) {
            alert('Please fill in all required fields');
            return null;
        }

        // Collect lessons
        const lessons = [];
        const lessonItems = document.querySelectorAll('.lesson-item');
        for (let item of lessonItems) {
            const titleInput = item.querySelector('.lesson-title');
            const descriptionInput = item.querySelector('.lesson-description');
            const urlInput = item.querySelector('.lesson-url');
            const durationInput = item.querySelector('.lesson-duration');
            
            if (titleInput.value.trim() && descriptionInput.value.trim() && urlInput.value.trim() && durationInput.value) {
                lessons.push({
                    title: titleInput.value.trim(),
                    description: descriptionInput.value.trim(),
                    url: urlInput.value.trim(),
                    duration: parseInt(durationInput.value)
                });
            }
        }

        if (lessons.length === 0) {
            alert('Please add at least one lesson');
            return null;
        }

        return {
            title,
            description,
            category,
            language,
            learningPoints,
            owner,
            lessons
        };
    }

    function showPreview(data) {
        const previewContent = document.getElementById('preview-content');
        const totalDuration = data.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
        
        previewContent.innerHTML = `
            <div class="preview-course">
                <h3>${data.title}</h3>
                <p><strong>Owner:</strong> ${data.owner}</p>
                <p><strong>Category:</strong> ${data.category}</p>
                <p><strong>Language:</strong> ${data.language}</p>
                <p><strong>Total Duration:</strong> ${totalDuration} minutes</p>
                <p><strong>Description:</strong> ${data.description}</p>
                <p><strong>Learning Points:</strong></p>
                <div>${data.learningPoints}</div>

                
                <h4>Lessons (${data.lessons.length}):</h4>
                <div>
                    ${data.lessons.map((lesson, index) => 
                        `<div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                            <strong>${index + 1}. ${lesson.title}</strong> (${lesson.duration} min)<br>
                            <small>${lesson.description}</small><br>
                            <a href="${lesson.url}" target="_blank">${lesson.url}</a>
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
        
        previewModal.classList.remove('hidden');
    }

    async function uploadCourse() {
        const formData = collectFormData();
        if (!formData) return;

        loadingOverlay.classList.remove('hidden');

        try {
            // Generate UUID for course ID
            const courseId = generateUUID();
            
            // Extract YouTube ID from first lesson URL
            const youtubeThumbnailId = extractYouTubeId(formData.lessons[0].url);
            
            // Insert course
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .insert([{
                    id: courseId,
                    title: formData.title,
                    description: formData.description,
                    category: formData.category,
                    language: formData.language,
                    learning_points: formData.learningPoints,
                    owner: formData.owner,
                    lessons: formData.lessons.length,
                    youtube_thumbnail_id: youtubeThumbnailId
                }])
                .select()
                .single();

            if (courseError) throw courseError;

            // Insert lessons
            const lessonsData = formData.lessons.map((lesson, index) => ({
                course_id: courseId,
                title: lesson.title,
                description: lesson.description,
                youtube_id: extractYouTubeId(lesson.url),
                order: index + 1,
                duration: lesson.duration
            }));

            const { error: lessonsError } = await supabase
                .from('lessons')
                .insert(lessonsData);

            if (lessonsError) throw lessonsError;

            alert('Course uploaded successfully!');
            form.reset();
            
            // Reset lessons to just one
            const container = document.getElementById('lessons-container');
            container.innerHTML = `
                <div class="lesson-item">
                    <input type="text" placeholder="Lesson 1 Title" class="lesson-title" required>
                    <textarea placeholder="Lesson 1 Description" class="lesson-description" rows="2" required></textarea>
                    <input type="url" placeholder="YouTube URL" class="lesson-url" required>
                    <input type="number" placeholder="Duration (minutes)" class="lesson-duration" min="1" required>
                    <button type="button" class="remove-lesson" onclick="removeLesson(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    }

    function formatLearningPoints(rawText) {
        return rawText
            .split('\n')
            .filter(point => point.trim())
            .map(point => `{${point.trim()}}`)
            .join('');
    }

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function extractYouTubeId(videoUrl) {
        try {
            const url = new URL(videoUrl);
            
            if (url.hostname.includes('youtube.com')) {
                return url.searchParams.get('v');
            } else if (url.hostname.includes('youtu.be')) {
                return url.pathname.slice(1);
            }
            
            return null;
        } catch {
            return null;
        }
    }
});

// Global function for removing lessons
window.removeLesson = function(button) {
    const container = document.getElementById('lessons-container');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('At least one lesson is required');
    }
};