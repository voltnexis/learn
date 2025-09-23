// Global Loading System for VoltEdge

class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.createGlobalLoader();
    }

    createGlobalLoader() {
        // Create global loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'globalLoadingOverlay';
        overlay.className = 'loading-overlay hidden';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-ring">
                    <div class="spinner-inner">
                        <i class="fas fa-bolt"></i>
                    </div>
                </div>
                <div class="loading-text">
                    <h3>VoltEdge</h3>
                    <p id="loadingMessage">Loading...</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    show(message = 'Loading...', id = 'default') {
        this.activeLoaders.add(id);
        const overlay = document.getElementById('globalLoadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        
        if (messageEl) messageEl.textContent = message;
        if (overlay) {
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hide(id = 'default') {
        this.activeLoaders.delete(id);
        
        // Only hide if no other loaders are active
        if (this.activeLoaders.size === 0) {
            const overlay = document.getElementById('globalLoadingOverlay');
            if (overlay) {
                overlay.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }
    }

    showSection(containerId, message = 'Loading...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="section-loading">
                <div class="loading-spinner-small">
                    <div class="spinner-ring-small">
                        <div class="spinner-inner-small">
                            <i class="fas fa-bolt"></i>
                        </div>
                    </div>
                </div>
                <p>${message}</p>
            </div>
        `;
    }

    showSkeleton(containerId, type = 'cards') {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletonHTML = '';
        
        if (type === 'cards') {
            skeletonHTML = Array(6).fill().map(() => `
                <div class="skeleton-card">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text short"></div>
                    </div>
                </div>
            `).join('');
        } else if (type === 'list') {
            skeletonHTML = Array(5).fill().map(() => `
                <div class="skeleton-list-item">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-text"></div>
                    </div>
                </div>
            `).join('');
        }

        container.innerHTML = skeletonHTML;
    }
}

// Create global instance
const loadingManager = new LoadingManager();
window.LoadingManager = loadingManager;

// Add CSS styles
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(17, 17, 17, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    }

    .loading-spinner {
        text-align: center;
        color: var(--text-light);
    }

    .spinner-ring {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        position: relative;
        border: 3px solid #333;
        border-radius: 50%;
        border-top-color: var(--accent-blue);
        animation: spin 1s linear infinite;
    }

    .spinner-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        color: var(--accent-blue);
        animation: pulse 2s ease-in-out infinite;
    }

    .loading-text h3 {
        margin: 0 0 10px 0;
        font-size: 24px;
        background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .loading-text p {
        margin: 0;
        color: var(--text-muted);
        font-size: 16px;
    }

    .section-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: var(--text-muted);
        grid-column: 1 / -1;
    }

    .loading-spinner-small {
        margin-bottom: 15px;
    }

    .spinner-ring-small {
        width: 40px;
        height: 40px;
        border: 2px solid #333;
        border-radius: 50%;
        border-top-color: var(--accent-blue);
        animation: spin 1s linear infinite;
        position: relative;
    }

    .spinner-inner-small {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        color: var(--accent-blue);
    }

    /* Skeleton Loading */
    .skeleton-card {
        background: var(--bg-card);
        border: 1px solid #333;
        border-radius: 16px;
        overflow: hidden;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-image {
        height: 200px;
        background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s infinite;
    }

    .skeleton-content {
        padding: 20px;
    }

    .skeleton-line {
        height: 12px;
        background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        background-size: 200% 100%;
        border-radius: 6px;
        margin-bottom: 10px;
        animation: skeleton-shimmer 1.5s infinite;
    }

    .skeleton-title {
        height: 16px;
        width: 80%;
    }

    .skeleton-text {
        width: 100%;
    }

    .skeleton-text.short {
        width: 60%;
    }

    .skeleton-list-item {
        display: flex;
        align-items: center;
        gap: 15px;
        background: var(--bg-card);
        border: 1px solid #333;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }

    @keyframes skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }

    .hidden {
        display: none !important;
    }
`;
document.head.appendChild(loadingStyles);

export default loadingManager;