/* ================================================
   PORTFOLIO PHOTOGRAPHE - GESTION DE LA GALERIE
   ================================================ */

// -------------------------------------
// 1. CONFIGURATION DE LA GALERIE
// -------------------------------------
const GALLERY_CONFIG = {
    // Options d'animation
    filterDuration: 600,
    imageLoadDelay: 100,
    lightboxDuration: 300,
    
    // Options de lazy loading
    lazyLoadOffset: 50,
    loadBatchSize: 3,
    
    // Breakpoints pour colonnes responsives
    gridBreakpoints: {
        mobile: 1,
        tablet: 2,
        desktop: 3
    },
    
    // Images par défaut (à remplacer par vraies images)
    placeholderImages: [
        'https://source.unsplash.com/800x800/?shadow,dark',
        'https://source.unsplash.com/800x800/?light,abstract',
        'https://source.unsplash.com/800x800/?architecture,monochrome',
        'https://source.unsplash.com/800x800/?texture,dark',
        'https://source.unsplash.com/800x800/?portrait,shadow',
        'https://source.unsplash.com/800x800/?minimal,black'
    ]
};

// -------------------------------------
// 2. CLASSE PRINCIPALE GALLERY
// -------------------------------------
class GalleryManager {
    constructor() {
        // Éléments DOM
        this.gallery = document.querySelector('.gallery');
        this.grid = document.querySelector('.gallery-grid');
        this.items = Array.from(document.querySelectorAll('.gallery-item'));
        this.filters = document.querySelectorAll('.filter-btn');
        this.lightbox = document.getElementById('lightbox');
        
        // État de la galerie
        this.state = {
            currentFilter: 'all',
            isLightboxOpen: false,
            loadedImages: new Set(),
            currentImageIndex: 0,
            isTransitioning: false
        };
        
        // Modules
        this.filterSystem = new FilterSystem(this);
        this.lightboxSystem = new LightboxSystem(this);
        this.lazyLoader = new LazyLoader(this);
        this.imageEffects = new ImageEffects(this);
    }
    
    init() {
        if (!this.gallery) return;
        
        console.log('📸 Initialisation de la galerie...');
        
        // Initialiser les modules
        this.filterSystem.init();
        this.lightboxSystem.init();
        this.lazyLoader.init();
        this.imageEffects.init();
        
        // Charger les images placeholder (dev)
        this.loadPlaceholderImages();
        
        // Ajouter les animations d'entrée
        this.animateGalleryEntry();
    }
    
    loadPlaceholderImages() {
        // En développement : charger des images depuis Unsplash
        this.items.forEach((item, index) => {
            const img = item.querySelector('img');
            if (!img.src || img.src.includes('photo-')) {
                img.src = GALLERY_CONFIG.placeholderImages[index % GALLERY_CONFIG.placeholderImages.length];
                img.onerror = () => {
                    img.src = `https://via.placeholder.com/800x800/1a1a1a/666666?text=Photo+${index + 1}`;
                };
            }
        });
    }
    
    animateGalleryEntry() {
        // Animation cascade pour l'apparition des images
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('reveal', 'active');
                    }, index * GALLERY_CONFIG.imageLoadDelay);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        this.items.forEach(item => observer.observe(item));
    }
}

// -------------------------------------
// 3. SYSTÈME DE FILTRAGE
// -------------------------------------
class FilterSystem {
    constructor(gallery) {
        this.gallery = gallery;
        this.activeFilter = 'all';
    }
    
    init() {
        this.setupFilterListeners();
        this.createFilterEffects();
    }
    
    setupFilterListeners() {
        this.gallery.filters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                e.preventDefault();
                
                const filterValue = filter.dataset.filter;
                if (filterValue === this.activeFilter || this.gallery.state.isTransitioning) return;
                
                this.applyFilter(filterValue);
                this.updateActiveButton(filter);
            });
        });
    }
    
    applyFilter(filterValue) {
        this.gallery.state.isTransitioning = true;
        this.activeFilter = filterValue;
        
        // Créer des groupes pour l'animation
        const itemsToShow = [];
        const itemsToHide = [];
        
        this.gallery.items.forEach(item => {
            const category = item.dataset.category;
            const shouldShow = filterValue === 'all' || category === filterValue;
            
            if (shouldShow && !item.classList.contains('show')) {
                itemsToShow.push(item);
            } else if (!shouldShow && !item.classList.contains('hidden')) {
                itemsToHide.push(item);
            }
        });
        
        // Animer la disparition
        this.animateItems(itemsToHide, 'hide').then(() => {
            // Réorganiser la grille
            this.rearrangeGrid();
            
            // Animer l'apparition
            return this.animateItems(itemsToShow, 'show');
        }).then(() => {
            this.gallery.state.isTransitioning = false;
        });
    }
    
    animateItems(items, action) {
        return new Promise(resolve => {
            if (items.length === 0) {
                resolve();
                return;
            }
            
            let completed = 0;
            const checkComplete = () => {
                completed++;
                if (completed === items.length) {
                    resolve();
                }
            };
            
            items.forEach((item, index) => {
                setTimeout(() => {
                    if (action === 'hide') {
                        item.classList.add('hidden');
                        item.classList.remove('show');
                    } else {
                        item.classList.remove('hidden');
                        item.classList.add('show');
                    }
                    
                    setTimeout(checkComplete, GALLERY_CONFIG.filterDuration);
                }, index * 50);
            });
        });
    }
    
    rearrangeGrid() {
        // Utiliser CSS Grid pour réorganiser automatiquement
        this.gallery.grid.style.gridAutoFlow = 'dense';
        
        // Forcer le reflow
        void this.gallery.grid.offsetHeight;
    }
    
    updateActiveButton(activeButton) {
        this.gallery.filters.forEach(btn => {
            btn.classList.remove('active');
        });
        activeButton.classList.add('active');
    }
    
    createFilterEffects() {
        // Ajouter un indicateur visuel de filtre actif
        const indicator = document.createElement('div');
        indicator.className = 'filter-indicator';
        
        const filtersContainer = document.querySelector('.gallery-filters');
        if (filtersContainer) {
            filtersContainer.appendChild(indicator);
            this.updateIndicatorPosition();
        }
    }
    
    updateIndicatorPosition() {
        const activeButton = document.querySelector('.filter-btn.active');
        const indicator = document.querySelector('.filter-indicator');
        
        if (activeButton && indicator) {
            const rect = activeButton.getBoundingClientRect();
            const parentRect = activeButton.parentElement.getBoundingClientRect();
            
            indicator.style.width = `${rect.width}px`;
            indicator.style.transform = `translateX(${rect.left - parentRect.left}px)`;
        }
    }
}

// -------------------------------------
// 4. SYSTÈME LIGHTBOX
// -------------------------------------
class LightboxSystem {
    constructor(gallery) {
        this.gallery = gallery;
        this.lightbox = gallery.lightbox;
        this.lightboxImage = this.lightbox?.querySelector('.lightbox-image');
        this.closeButton = this.lightbox?.querySelector('.lightbox-close');
        this.currentIndex = 0;
    }
    
    init() {
        if (!this.lightbox) return;
        
        this.setupLightboxListeners();
        this.addKeyboardNavigation();
        this.addTouchGestures();
    }
    
    setupLightboxListeners() {
        // Ouvrir la lightbox au clic sur une image
        this.gallery.items.forEach((item, index) => {
            item.addEventListener('click', () => {
                if (!this.gallery.state.isTransitioning) {
                    this.openLightbox(index);
                }
            });
        });
        
        // Fermer la lightbox
        this.closeButton?.addEventListener('click', () => this.closeLightbox());
        
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });
    }
    
    openLightbox(index) {
        this.currentIndex = index;
        this.gallery.state.isLightboxOpen = true;
        
        const item = this.gallery.items[index];
        const img = item.querySelector('img');
        
        // Préparer l'image
        this.lightboxImage.src = img.src;
        this.lightboxImage.alt = img.alt;
        
        // Ajouter navigation si plusieurs images
        if (this.gallery.items.length > 1) {
            this.addNavigationButtons();
        }
        
        // Animer l'ouverture
        document.body.style.overflow = 'hidden';
        this.lightbox.classList.add('active');
        
        // Animation de zoom depuis l'image d'origine
        this.animateImageZoom(item, true);
    }
    
    closeLightbox() {
        this.gallery.state.isLightboxOpen = false;
        
        // Animer la fermeture
        const currentItem = this.gallery.items[this.currentIndex];
        this.animateImageZoom(currentItem, false);
        
        this.lightbox.classList.remove('active');
        document.body.style.overflow = '';
        
        // Nettoyer après l'animation
        setTimeout(() => {
            this.removeNavigationButtons();
        }, GALLERY_CONFIG.lightboxDuration);
    }
    
    animateImageZoom(item, isOpening) {
        const itemRect = item.getBoundingClientRect();
        const lightboxRect = this.lightboxImage.getBoundingClientRect();
        
        if (isOpening) {
            // Animation d'ouverture : de la position de l'item vers le centre
            this.lightboxImage.style.transition = 'none';
            this.lightboxImage.style.transform = `
                translate(${itemRect.left - lightboxRect.left}px, ${itemRect.top - lightboxRect.top}px)
                scale(${itemRect.width / lightboxRect.width})
            `;
            
            // Forcer le reflow
            void this.lightboxImage.offsetHeight;
            
            this.lightboxImage.style.transition = `transform ${GALLERY_CONFIG.lightboxDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            this.lightboxImage.style.transform = 'translate(0, 0) scale(1)';
        } else {
            // Animation de fermeture : du centre vers la position de l'item
            this.lightboxImage.style.transform = `
                translate(${itemRect.left - lightboxRect.left}px, ${itemRect.top - lightboxRect.top}px)
                scale(${itemRect.width / lightboxRect.width})
            `;
        }
    }
    
    addNavigationButtons() {
        if (document.querySelector('.lightbox-nav')) return;
        
        const navHTML = `
            <button class="lightbox-nav lightbox-prev" aria-label="Image précédente">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
            </button>
            <button class="lightbox-nav lightbox-next" aria-label="Image suivante">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
            </button>
            <div class="lightbox-counter">
                <span class="current-index">${this.currentIndex + 1}</span> / <span class="total-count">${this.gallery.items.length}</span>
            </div>
        `;
        
        this.lightbox.insertAdjacentHTML('beforeend', navHTML);
        
        // Ajouter les listeners
        const prevBtn = this.lightbox.querySelector('.lightbox-prev');
        const nextBtn = this.lightbox.querySelector('.lightbox-next');
        
        prevBtn?.addEventListener('click', () => this.navigate(-1));
        nextBtn?.addEventListener('click', () => this.navigate(1));
    }
    
    removeNavigationButtons() {
        const navElements = this.lightbox.querySelectorAll('.lightbox-nav, .lightbox-counter');
        navElements.forEach(el => el.remove());
    }
    
    navigate(direction) {
        const visibleItems = this.gallery.items.filter(item => !item.classList.contains('hidden'));
        const currentVisibleIndex = visibleItems.indexOf(this.gallery.items[this.currentIndex]);
        
        let newIndex = currentVisibleIndex + direction;
        
        // Boucler
        if (newIndex < 0) newIndex = visibleItems.length - 1;
        if (newIndex >= visibleItems.length) newIndex = 0;
        
        const newItem = visibleItems[newIndex];
        const newGlobalIndex = this.gallery.items.indexOf(newItem);
        
        // Animer la transition
        this.lightboxImage.style.opacity = '0';
        
        setTimeout(() => {
            const img = newItem.querySelector('img');
            this.lightboxImage.src = img.src;
            this.lightboxImage.alt = img.alt;
            this.currentIndex = newGlobalIndex;
            
            // Mettre à jour le compteur
            const counter = this.lightbox.querySelector('.current-index');
            if (counter) counter.textContent = newIndex + 1;
            
            this.lightboxImage.style.opacity = '1';
        }, 150);
    }
    
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.gallery.state.isLightboxOpen) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.navigate(-1);
                    break;
                case 'ArrowRight':
                    this.navigate(1);
                    break;
                case 'Escape':
                    this.closeLightbox();
                    break;
            }
        });
    }
    
    addTouchGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        this.lightbox?.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        this.lightbox?.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        
        const handleSwipe = () => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next image
                    this.navigate(1);
                } else {
                    // Swipe right - previous image
                    this.navigate(-1);
                }
            }
        };
        
        this.handleSwipe = handleSwipe;
    }
}

// -------------------------------------
// 5. LAZY LOADING
// -------------------------------------
class LazyLoader {
    constructor(gallery) {
        this.gallery = gallery;
        this.imageObserver = null;
    }
    
    init() {
        this.setupIntersectionObserver();
        this.preloadNextBatch();
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: `${GALLERY_CONFIG.lazyLoadOffset}px`,
            threshold: 0.01
        };
        
        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, options);
        
        // Observer toutes les images
        this.gallery.items.forEach(item => {
            const img = item.querySelector('img');
            if (img && !this.gallery.state.loadedImages.has(img)) {
                this.imageObserver.observe(item);
            }
        });
    }
    
    loadImage(item) {
        const img = item.querySelector('img');
        if (!img || this.gallery.state.loadedImages.has(img)) return;
        
        // Ajouter un loader
        const loader = document.createElement('div');
        loader.className = 'image-loader';
        item.appendChild(loader);
        
        // Créer une nouvelle image pour préchargement
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = tempImg.src;
            img.classList.add('loaded');
            this.gallery.state.loadedImages.add(img);
            
            // Retirer le loader avec animation
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 300);
            }, 100);
            
            // Arrêter d'observer
            this.imageObserver.unobserve(item);
        };
        
        tempImg.onerror = () => {
            console.error('Erreur de chargement:', img.dataset.src);
            loader.remove();
        };
        
        // Charger l'image haute résolution
        tempImg.src = img.dataset.src || img.src;
    }
    
    preloadNextBatch() {
        // Précharger les prochaines images pour une expérience fluide
        const visibleCount = this.gallery.items.filter(item => 
            !item.classList.contains('hidden')
        ).length;
        
        const startIndex = Math.min(GALLERY_CONFIG.loadBatchSize, visibleCount);
        
        for (let i = startIndex; i < startIndex + GALLERY_CONFIG.loadBatchSize && i < this.gallery.items.length; i++) {
            const item = this.gallery.items[i];
            const img = item.querySelector('img');
            
            if (img && !this.gallery.state.loadedImages.has(img)) {
                const preloadImg = new Image();
                preloadImg.src = img.dataset.src || img.src;
            }
        }
    }
}

// -------------------------------------
// 6. EFFETS D'IMAGE
// -------------------------------------
class ImageEffects {
    constructor(gallery) {
        this.gallery = gallery;
    }
    
    init() {
        this.addHoverEffects();
        this.addLoadingEffects();
        this.addParallaxEffect();
    }
    
    addHoverEffects() {
        this.gallery.items.forEach(item => {
            const overlay = item.querySelector('.gallery-overlay');
            
            item.addEventListener('mouseenter', (e) => {
                this.magneticEffect(item, e);
            });
            
            item.addEventListener('mousemove', (e) => {
                this.magneticEffect(item, e);
                this.tiltEffect(item, e);
            });
            
            item.addEventListener('mouseleave', () => {
                this.resetEffects(item);
            });
        });
    }
    
    magneticEffect(item, e) {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        
        const img = item.querySelector('img');
        if (img) {
            img.style.transform = `
                scale(1.1)
                translate(${deltaX * 10}px, ${deltaY * 10}px)
            `;
        }
    }
    
    tiltEffect(item, e) {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * 10;
        const rotateY = ((x - centerX) / centerX) * -10;
        
        item.style.transform = `
            perspective(1000px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateZ(10px)
        `;
    }
    
    resetEffects(item) {
        const img = item.querySelector('img');
        if (img) {
            img.style.transform = 'scale(1) translate(0, 0)';
        }
        item.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
    }
    
    addLoadingEffects() {
        // Style CSS pour le loader
        const style = document.createElement('style');
        style.textContent = `
            .image-loader {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 40px;
                height: 40px;
                margin: -20px 0 0 -20px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-top-color: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                transition: opacity 0.3s ease;
            }
            
            .gallery-item img {
                opacity: 0;
                transition: opacity 0.6s ease;
            }
            
            .gallery-item img.loaded {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    addParallaxEffect() {
        if (window.innerWidth <= 768) return; // Désactiver sur mobile
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const galleryTop = this.gallery.gallery.offsetTop;
            const galleryHeight = this.gallery.gallery.offsetHeight;
            
            // Vérifier si la galerie est visible
            if (scrolled > galleryTop - window.innerHeight && scrolled < galleryTop + galleryHeight) {
                this.gallery.items.forEach((item, index) => {
                    const speed = 0.5 + (index % 3) * 0.2; // Vitesses variées
                    const yPos = -(scrolled - galleryTop) * speed * 0.1;
                    
                    item.style.transform = `translateY(${yPos}px)`;
                });
            }
        });
    }
}

// -------------------------------------
// 7. INITIALISATION
// -------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const galleryManager = new GalleryManager();
    galleryManager.init();
    
    // Exposer l'API pour utilisation externe
    window.GalleryAPI = {
        manager: galleryManager,
        
        // Méthodes publiques
        filter: (category) => {
            galleryManager.filterSystem.applyFilter(category);
        },
        
        openImage: (index) => {
            galleryManager.lightboxSystem.openLightbox(index);
        },
        
        refresh: () => {
            galleryManager.lazyLoader.setupIntersectionObserver();
        }
    };
});