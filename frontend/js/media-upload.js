/**
 * Media Upload Manager for Admin Portal
 * Handles file uploads with preview functionality for images, videos, and audio
 */

class MediaUploadManager {
    constructor() {
        this.supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.supportedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
        this.supportedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.init();
    }

    init() {
        try {
            // Initialize all file inputs when DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeFileInputs());
            } else {
                this.initializeFileInputs();
            }
        } catch (error) {
            console.error('Error initializing MediaUploadManager:', error);
        }
    }

    initializeFileInputs() {
        try {
            // Blog image upload
            this.setupFileInput('blogImageFile', 'blogImagePreview', 'image');
            
            // Event image/video upload
            this.setupFileInput('eventImageFile', 'eventImagePreview', 'media');
            
            // Sermon uploads
            this.setupFileInput('sermonVideoFile', 'sermonVideoPreview', 'video');
            this.setupFileInput('sermonAudioFile', 'sermonAudioPreview', 'audio');
            this.setupFileInput('sermonThumbnailFile', 'sermonThumbnailPreview', 'image');

            console.log('Media upload inputs initialized successfully');
        } catch (error) {
            console.error('Error setting up file inputs:', error);
        }
    }

    setupFileInput(inputId, previewId, mediaType) {
        try {
            const fileInput = document.getElementById(inputId);
            const previewContainer = document.getElementById(previewId);

            if (!fileInput || !previewContainer) {
                console.warn(`File input or preview container not found: ${inputId}, ${previewId}`);
                return;
            }

            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e, previewContainer, mediaType);
            });

            // Add drag and drop functionality
            this.setupDragAndDrop(fileInput, previewContainer, mediaType);

        } catch (error) {
            console.error(`Error setting up file input ${inputId}:`, error);
        }
    }

    handleFileSelection(event, previewContainer, mediaType) {
        try {
            const file = event.target.files[0];
            
            if (!file) {
                this.clearPreview(previewContainer);
                return;
            }

            // Validate file
            const validation = this.validateFile(file, mediaType);
            if (!validation.valid) {
                this.showError(validation.message);
                this.clearPreview(previewContainer);
                event.target.value = ''; // Clear the input
                return;
            }

            // Show preview
            this.showPreview(file, previewContainer, mediaType);

        } catch (error) {
            console.error('Error handling file selection:', error);
            this.showError('Error processing selected file');
        }
    }

    validateFile(file, mediaType) {
        try {
            // Check file size
            if (file.size > this.maxFileSize) {
                return {
                    valid: false,
                    message: `File size too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`
                };
            }

            // Check file type
            let validTypes = [];
            switch (mediaType) {
                case 'image':
                    validTypes = this.supportedImageTypes;
                    break;
                case 'video':
                    validTypes = this.supportedVideoTypes;
                    break;
                case 'audio':
                    validTypes = this.supportedAudioTypes;
                    break;
                case 'media':
                    validTypes = [...this.supportedImageTypes, ...this.supportedVideoTypes];
                    break;
                default:
                    validTypes = [...this.supportedImageTypes, ...this.supportedVideoTypes, ...this.supportedAudioTypes];
            }

            if (!validTypes.includes(file.type)) {
                return {
                    valid: false,
                    message: `Unsupported file type: ${file.type}`
                };
            }

            return { valid: true };

        } catch (error) {
            console.error('Error validating file:', error);
            return { valid: false, message: 'Error validating file' };
        }
    }

    showPreview(file, previewContainer, mediaType) {
        try {
            const url = URL.createObjectURL(file);
            
            // Clear existing content
            previewContainer.innerHTML = '';
            previewContainer.classList.add('has-media');

            let mediaElement;
            
            if (file.type.startsWith('image/')) {
                mediaElement = document.createElement('img');
                mediaElement.src = url;
                mediaElement.alt = 'Preview';
            } else if (file.type.startsWith('video/')) {
                mediaElement = document.createElement('video');
                mediaElement.src = url;
                mediaElement.controls = true;
                mediaElement.muted = true; // Prevent autoplay issues
            } else if (file.type.startsWith('audio/')) {
                mediaElement = document.createElement('audio');
                mediaElement.src = url;
                mediaElement.controls = true;
            }

            if (mediaElement) {
                previewContainer.appendChild(mediaElement);

                // Add file info
                const infoDiv = document.createElement('div');
                infoDiv.className = 'preview-info';
                infoDiv.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
                previewContainer.appendChild(infoDiv);

                // Add remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-preview';
                removeBtn.innerHTML = '×';
                removeBtn.title = 'Remove file';
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.removeFile(previewContainer, url);
                });
                previewContainer.appendChild(removeBtn);

                // Clean up URL when element is removed
                mediaElement.addEventListener('load', () => {
                    // Keep URL for form submission, will be cleaned up on form reset
                });
            }

        } catch (error) {
            console.error('Error showing preview:', error);
            this.showError('Error displaying file preview');
        }
    }

    removeFile(previewContainer, url) {
        try {
            // Clean up object URL
            URL.revokeObjectURL(url);
            
            // Clear preview
            this.clearPreview(previewContainer);
            
            // Clear corresponding file input
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                if (input.files.length > 0) {
                    // Find the input that corresponds to this preview
                    const previewId = previewContainer.id;
                    const inputId = previewId.replace('Preview', 'File');
                    if (input.id === inputId) {
                        input.value = '';
                    }
                }
            });

        } catch (error) {
            console.error('Error removing file:', error);
        }
    }

    clearPreview(previewContainer) {
        try {
            previewContainer.innerHTML = '<div class="preview-placeholder">No file selected</div>';
            previewContainer.classList.remove('has-media');
        } catch (error) {
            console.error('Error clearing preview:', error);
        }
    }

    setupDragAndDrop(fileInput, previewContainer, mediaType) {
        try {
            const dropZone = previewContainer;

            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });

            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.style.borderColor = 'var(--primary-color)';
                    dropZone.style.backgroundColor = '#f0f8ff';
                });
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => {
                    dropZone.style.borderColor = '#e0e0e0';
                    dropZone.style.backgroundColor = '#fafafa';
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    // Simulate file input change
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(files[0]);
                    fileInput.files = dataTransfer.files;
                    
                    // Trigger change event
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

        } catch (error) {
            console.error('Error setting up drag and drop:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        try {
            // Use existing toast system if available
            if (typeof showToast === 'function') {
                showToast('error', message);
            } else {
                // Fallback to alert
                alert('Error: ' + message);
            }
        } catch (error) {
            console.error('Error showing error message:', error);
        }
    }

    // Method to get file data for form submission
    getFileData(inputId) {
        try {
            const fileInput = document.getElementById(inputId);
            return fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
        } catch (error) {
            console.error(`Error getting file data for ${inputId}:`, error);
            return null;
        }
    }

    // Method to clear all previews (useful for form reset)
    clearAllPreviews() {
        try {
            const previewContainers = document.querySelectorAll('.media-preview-container');
            previewContainers.forEach(container => {
                this.clearPreview(container);
            });
        } catch (error) {
            console.error('Error clearing all previews:', error);
        }
    }
}

// Initialize the media upload manager
const mediaUploadManager = new MediaUploadManager();

// Make it globally accessible
window.MediaUploadManager = mediaUploadManager;
