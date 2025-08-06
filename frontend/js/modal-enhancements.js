/**
 * Modal Enhancements - Draggable and Resizable Functionality
 * Enhances admin portal modals with drag and resize capabilities
 * Compatible with existing modal system and TinyMCE editors
 */

class ModalEnhancer {
    constructor() {
        this.dragData = null;
        this.resizeData = null;
        this.modalPositions = new Map(); // Store modal positions
        this.modalSizes = new Map(); // Store modal sizes
        this.isMobile = window.innerWidth <= 768;
        
        // Bind methods to preserve context
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        this.init();
    }
    
    init() {
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEnhancements());
        } else {
            this.setupEnhancements();
        }
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize);
    }
    
    setupEnhancements() {
        // Target modal IDs for enhancement
        const modalIds = ['blogFormModal', 'eventFormModal', 'sermonFormModal'];
        
        modalIds.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                this.enhanceModal(modal);
            }
        });
        
        // Set up global event listeners
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        
        console.log('Modal enhancements initialized for draggable and resizable functionality');
    }
    
    enhanceModal(modal) {
        const modalContent = modal.querySelector('.modal-content');
        const modalHeader = modal.querySelector('.modal-header');
        
        if (!modalContent || !modalHeader) return;
        
        // Add enhancement classes
        modal.classList.add('draggable-modal', 'resizable-modal', 'positioned-modal');
        
        // Add resize handles (only on desktop)
        if (!this.isMobile) {
            this.addResizeHandles(modalContent);
        }
        
        // Store original modal open function and enhance it
        this.enhanceModalOpen(modal);
        
        // Prevent dragging when clicking on form elements
        this.setupDragPrevention(modal);
    }
    
    addResizeHandles(modalContent) {
        const handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${direction}`;
            handle.dataset.direction = direction;
            modalContent.appendChild(handle);
        });
    }
    
    enhanceModalOpen(modal) {
        // Override the modal display to center it initially
        const originalDisplay = modal.style.display;
        
        // Watch for modal visibility changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (modal.style.display === 'flex' || modal.classList.contains('active')) {
                        this.centerModal(modal);
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    
    centerModal(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;

        const modalId = modal.id;

        // Set compact initial size if no saved size exists
        if (!this.modalSizes.has(modalId) && !this.isMobile) {
            // Set initial compact dimensions
            const initialWidth = Math.min(450, window.innerWidth * 0.9);
            const initialHeight = Math.min(600, window.innerHeight * 0.8);

            modalContent.style.width = initialWidth + 'px';
            modalContent.style.height = initialHeight + 'px';
        }

        // Restore saved position and size if available
        if (this.modalPositions.has(modalId)) {
            const position = this.modalPositions.get(modalId);
            modalContent.style.left = position.left + 'px';
            modalContent.style.top = position.top + 'px';
        } else {
            // Center the modal
            const rect = modalContent.getBoundingClientRect();
            const centerX = (window.innerWidth - rect.width) / 2;
            const centerY = (window.innerHeight - rect.height) / 2;

            modalContent.style.left = Math.max(0, centerX) + 'px';
            modalContent.style.top = Math.max(0, centerY) + 'px';
        }

        // Restore saved size if available (this will override initial size)
        if (this.modalSizes.has(modalId)) {
            const size = this.modalSizes.get(modalId);
            modalContent.style.width = size.width + 'px';
            modalContent.style.height = size.height + 'px';
        }
    }
    
    setupDragPrevention(modal) {
        // Prevent dragging when clicking on form elements
        const preventDragElements = modal.querySelectorAll('input, textarea, select, button, .close-modal, .tox-tinymce');
        
        preventDragElements.forEach(element => {
            element.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });
    }
    
    handleMouseDown(e) {
        if (this.isMobile) return;
        
        const modal = e.target.closest('.draggable-modal, .resizable-modal');
        if (!modal) return;
        
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        // Handle resize
        if (e.target.classList.contains('resize-handle')) {
            this.startResize(e, modal, modalContent);
            return;
        }
        
        // Handle drag (only from header)
        if (e.target.closest('.modal-header') && !e.target.classList.contains('close-modal')) {
            this.startDrag(e, modal, modalContent);
        }
    }
    
    startDrag(e, modal, modalContent) {
        const rect = modalContent.getBoundingClientRect();
        
        this.dragData = {
            modal,
            modalContent,
            startX: e.clientX,
            startY: e.clientY,
            startLeft: rect.left,
            startTop: rect.top
        };
        
        modal.classList.add('dragging');
        document.body.style.cursor = 'move';
        e.preventDefault();
    }
    
    startResize(e, modal, modalContent) {
        const rect = modalContent.getBoundingClientRect();
        const direction = e.target.dataset.direction;
        
        this.resizeData = {
            modal,
            modalContent,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height,
            startLeft: rect.left,
            startTop: rect.top
        };
        
        modal.classList.add('resizing');
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        if (this.dragData) {
            this.performDrag(e);
        } else if (this.resizeData) {
            this.performResize(e);
        }
    }
    
    performDrag(e) {
        const { modal, modalContent, startX, startY, startLeft, startTop } = this.dragData;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newLeft = startLeft + deltaX;
        let newTop = startTop + deltaY;
        
        // Keep modal within viewport bounds
        const rect = modalContent.getBoundingClientRect();
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - rect.width));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - rect.height));
        
        modalContent.style.left = newLeft + 'px';
        modalContent.style.top = newTop + 'px';
    }
    
    performResize(e) {
        const { modal, modalContent, direction, startX, startY, startWidth, startHeight, startLeft, startTop } = this.resizeData;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        // Calculate new dimensions based on resize direction
        if (direction.includes('e')) newWidth = startWidth + deltaX;
        if (direction.includes('w')) {
            newWidth = startWidth - deltaX;
            newLeft = startLeft + deltaX;
        }
        if (direction.includes('s')) newHeight = startHeight + deltaY;
        if (direction.includes('n')) {
            newHeight = startHeight - deltaY;
            newTop = startTop + deltaY;
        }
        
        // Apply constraints
        const minWidth = 400;
        const minHeight = 300;
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.95;
        
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        
        // Adjust position if we hit minimum size constraints
        if (direction.includes('w') && newWidth === minWidth) {
            newLeft = startLeft + startWidth - minWidth;
        }
        if (direction.includes('n') && newHeight === minHeight) {
            newTop = startTop + startHeight - minHeight;
        }
        
        // Keep within viewport
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - newWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - newHeight));
        
        // Apply new dimensions and position
        modalContent.style.width = newWidth + 'px';
        modalContent.style.height = newHeight + 'px';
        modalContent.style.left = newLeft + 'px';
        modalContent.style.top = newTop + 'px';
        
        // Ensure TinyMCE editors adapt to new size
        this.resizeTinyMCEEditors(modal);
    }
    
    resizeTinyMCEEditors(modal) {
        // Trigger TinyMCE resize for editors in this modal
        const textareas = modal.querySelectorAll('.tinymce-editor');
        textareas.forEach(textarea => {
            if (typeof tinymce !== 'undefined') {
                const editor = tinymce.get(textarea.id);
                if (editor) {
                    // Delay resize to allow modal to finish resizing
                    setTimeout(() => {
                        editor.execCommand('mceAutoResize');
                    }, 100);
                }
            }
        });
    }
    
    handleMouseUp(e) {
        if (this.dragData) {
            const { modal, modalContent } = this.dragData;
            
            // Save position
            const rect = modalContent.getBoundingClientRect();
            this.modalPositions.set(modal.id, {
                left: rect.left,
                top: rect.top
            });
            
            modal.classList.remove('dragging');
            document.body.style.cursor = '';
            this.dragData = null;
        }
        
        if (this.resizeData) {
            const { modal, modalContent } = this.resizeData;
            
            // Save size
            const rect = modalContent.getBoundingClientRect();
            this.modalSizes.set(modal.id, {
                width: rect.width,
                height: rect.height
            });
            
            modal.classList.remove('resizing');
            this.resizeData = null;
        }
    }
    
    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;

        // If switching to/from mobile, reinitialize
        if (wasMobile !== this.isMobile) {
            this.setupEnhancements();
        }

        // Ensure modals stay within viewport after window resize
        document.querySelectorAll('.positioned-modal .modal-content').forEach(modalContent => {
            const rect = modalContent.getBoundingClientRect();
            if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
                const newLeft = Math.max(0, Math.min(rect.left, window.innerWidth - rect.width));
                const newTop = Math.max(0, Math.min(rect.top, window.innerHeight - rect.height));

                modalContent.style.left = newLeft + 'px';
                modalContent.style.top = newTop + 'px';
            }
        });
    }

    // Public method to reset modal positions (useful for testing)
    resetModalPositions() {
        this.modalPositions.clear();
        this.modalSizes.clear();

        document.querySelectorAll('.positioned-modal .modal-content').forEach(modalContent => {
            modalContent.style.left = '';
            modalContent.style.top = '';
            modalContent.style.width = '';
            modalContent.style.height = '';
        });

        console.log('Modal positions and sizes reset');
    }

    // Public method to get modal enhancement status
    getStatus() {
        return {
            isMobile: this.isMobile,
            enhancedModals: document.querySelectorAll('.draggable-modal').length,
            savedPositions: this.modalPositions.size,
            savedSizes: this.modalSizes.size,
            isDragging: !!this.dragData,
            isResizing: !!this.resizeData
        };
    }
}

// Initialize modal enhancements
const modalEnhancer = new ModalEnhancer();
