/* ================================================
   PORTFOLIO PHOTOGRAPHE - SCRIPT PRINCIPAL
   ================================================ */

// -------------------------------------
// 1. CONFIGURATION GLOBALE
// -------------------------------------
const CONFIG = {
    // Durées des animations
    loaderDelay: 2000,
    scrollThreshold: 50,
    revealOffset: 100,
    
    // Breakpoints responsive
    breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
    },
    
    // Options d'animation
    animationDuration: 800,
    easingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

// État global de l'application
const APP_STATE = {
    isLoading: true,
    scrollPosition: 0,
    isMobile: window.innerWidth <= CONFIG.breakpoints.mobile
};

// -------------------------------------
// 2. LOADER INITIAL
// -------------------------------------
class LoaderManager {
    constructor() {
        this.loader = document.getElementById('loader');
        this.body = document.body;
    }
    
    init() {
        // Empêcher le scroll pendant le chargement
        this.body.style.overflow = 'hidden';
        
        // Simuler le chargement des ressources
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.hide();
            }, CONFIG.loaderDelay);
        });
    }
    
    hide() {
        this.loader.classList.add('hidden');
        this.body.style.overflow = '';
        APP_STATE.isLoading = false;
        
        // Déclencher les animations d'entrée
        this.triggerEntryAnimations();
        
        // Supprimer le loader du DOM après la transition
        setTimeout(() => {
            this.loader.remove();
        }, 600);
    }
    
    triggerEntryAnimations() {
        // Animer les éléments de la hero section
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
        });
    }
}

// -------------------------------------
// 3. CURSOR PERSONNALISÉ
// -------------------------------------
class CustomCursor {
    constructor() {
        this.cursor = null;
        this.follower = null;
        this.coords = { x: 0, y: 0 };
        this.previousCoords = { x: 0, y: 0 };
    }
    
    init() {
        // Ne pas initialiser sur mobile/tablette
        if (APP_STATE.isMobile || 'ontouchstart' in window) return;
        
        this.createCursor();
        this.addEventListeners();
    }
    
    createCursor() {
        // Créer les éléments du cursor
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor';
        
        this.follower = document.createElement('div');
        this.follower.className = 'cursor-follower';
        
        document.body.appendChild(this.cursor);
        document.body.appendChild(this.follower);
    }
    
    addEventListeners() {
        // Mouvement de la souris
        document.addEventListener('mousemove', (e) => {
            this.coords.x = e.clientX;
            this.coords.y = e.clientY;
        });
        
        // Animation frame pour un mouvement fluide
        const animateCursor = () => {
            const deltaX = this.coords.x - this.previousCoords.x;
            const deltaY = this.coords.y - this.previousCoords.y;
            
            this.previousCoords.x += deltaX * 0.35;
            this.previousCoords.y += deltaY * 0.35;
            
            // Cursor principal (rapide)
            this.cursor.style.left = `${this.coords.x}px`;
            this.cursor.style.top = `${this.coords.y}px`;
            
            // Follower (lent)
            this.follower.style.left = `${this.previousCoords.x}px`;
            this.follower.style.top = `${this.previousCoords.y}px`;
            
            requestAnimationFrame(animateCursor);
        };
        animateCursor();
        
        // Hover sur les éléments interactifs
        const interactiveElements = document.querySelectorAll('a, button, .gallery-item');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.cursor.classList.add('hover');
            });
            
            el.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('hover');
            });
        });
        
        // Click effect
        document.addEventListener('mousedown', () => {
            this.cursor.classList.add('click');
        });
        
        document.addEventListener('mouseup', () => {
            this.cursor.classList.remove('click');
        });
    }
}

// -------------------------------------
// 4. NAVIGATION & SCROLL
// -------------------------------------
class NavigationManager {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navMenu = document.getElementById('navMenu');
        this.navBurger = document.getElementById('navBurger');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.scrollPosition = 0;
    }
    
    init() {
        this.handleScroll();
        this.handleMobileMenu();
        this.handleSmoothScroll();
        this.updateActiveSection();
    }
    
    handleScroll() {
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Ajouter/retirer la classe scrolled
            if (currentScroll > CONFIG.scrollThreshold) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
            
            // Masquer/afficher la navbar selon la direction du scroll
            if (currentScroll > lastScroll && currentScroll > 500) {
                this.navbar.style.transform = 'translateY(-100%)';
            } else {
                this.navbar.style.transform = 'translateY(0)';
            }
            
            lastScroll = currentScroll;
            APP_STATE.scrollPosition = currentScroll;
        });
    }
    
    handleMobileMenu() {
        this.navBurger.addEventListener('click', () => {
            this.navMenu.classList.toggle('active');
            this.navBurger.classList.toggle('active');
            
            // Empêcher le scroll quand le menu est ouvert
            document.body.style.overflow = 
                this.navMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Fermer le menu au clic sur un lien
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.navMenu.classList.remove('active');
                this.navBurger.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    handleSmoothScroll() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    const offset = this.navbar.offsetHeight;
                    const targetPosition = targetSection.offsetTop - offset;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        
        window.addEventListener('scroll', () => {
            const scrollY = window.pageYOffset;
            
            sections.forEach(section => {
                const sectionHeight = section.offsetHeight;
                const sectionTop = section.offsetTop - 100;
                const sectionId = section.getAttribute('id');
                
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    this.navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }
}

// -------------------------------------
// 5. ANIMATIONS AU SCROLL
// -------------------------------------
class ScrollAnimations {
    constructor() {
        this.animatedElements = [];
        this.parallaxElements = [];
    }
    
    init() {
        this.setupRevealAnimations();
        this.setupParallax();
        this.setupScrollProgress();
    }
    
    setupRevealAnimations() {
        // Sélectionner tous les éléments à animer
        const reveals = document.querySelectorAll('.reveal, .about-paragraph, .gallery-item');
        
        // Options pour l'Intersection Observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: `0px 0px -${CONFIG.revealOffset}px 0px`
        };
        
        // Créer l'observer
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    
                    // Optionnel : arrêter d'observer après l'animation
                    // revealObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observer chaque élément
        reveals.forEach(el => {
            revealObserver.observe(el);
        });
    }
    
    setupParallax() {
        // Sélectionner les éléments avec parallax
        this.parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (this.parallaxElements.length === 0 || APP_STATE.isMobile) return;
        
        // Mettre à jour la position au scroll
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            this.parallaxElements.forEach(el => {
                const speed = el.dataset.parallax === 'slow' ? 0.5 : 
                             el.dataset.parallax === 'fast' ? 1.5 : 1;
                const yPos = -(scrolled * speed);
                
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }
    
    setupScrollProgress() {
        // Créer la barre de progression
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
        document.body.appendChild(progressBar);
        
        const progressBarFill = progressBar.querySelector('.scroll-progress-bar');
        
        // Mettre à jour la progression au scroll
        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.pageYOffset;
            const progress = (scrolled / documentHeight) * 100;
            
            progressBarFill.style.width = `${progress}%`;
        });
    }
}

// -------------------------------------
// 6. EFFETS VISUELS
// -------------------------------------
class VisualEffects {
    constructor() {
        this.particles = [];
        this.grainEffect = null;
    }
    
    init() {
        this.createParticles();
        this.createGrainEffect();
        this.createVignetteEffect();
        this.animateHeroText();
    }
    
    createParticles() {
        // Ne pas créer sur mobile pour les performances
        if (APP_STATE.isMobile) return;
        
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        
        // Créer 10 particules
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particlesContainer.appendChild(particle);
        }
        
        // Ajouter au hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.appendChild(particlesContainer);
        }
    }
    
    createGrainEffect() {
        const grain = document.createElement('div');
        grain.className = 'grain';
        document.body.appendChild(grain);
    }
    
    createVignetteEffect() {
        const vignette = document.createElement('div');
        vignette.className = 'vignette';
        document.body.appendChild(vignette);
    }
    
    animateHeroText() {
        // Split text animation pour le titre
        const heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;
        
        // Diviser le texte en caractères
        const titleLines = heroTitle.querySelectorAll('.title-line');
        titleLines.forEach(line => {
            const text = line.textContent;
            line.innerHTML = text.split('').map((char, index) => {
                if (char === ' ') return ' ';
                return `<span class="char" style="animation-delay: ${index * 0.05}s">${char}</span>`;
            }).join('');
        });
    }
}

// -------------------------------------
// 7. GESTION DU FORMULAIRE
// -------------------------------------
class FormManager {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.formGroups = document.querySelectorAll('.form-group');
    }
    
    init() {
        if (!this.form) return;
        
        this.handleFormSubmit();
        this.addFloatingLabels();
    }
    
    handleFormSubmit() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Animation de soumission
            const submitBtn = this.form.querySelector('.form-submit');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<span>Envoi en cours...</span>';
            submitBtn.disabled = true;
            
            // Simuler l'envoi (remplacer par une vraie logique d'envoi)
            setTimeout(() => {
                submitBtn.innerHTML = '<span>Message envoyé ✓</span>';
                submitBtn.style.borderColor = '#4CAF50';
                submitBtn.style.color = '#4CAF50';
                
                // Reset après 3 secondes
                setTimeout(() => {
                    this.form.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.borderColor = '';
                    submitBtn.style.color = '';
                }, 3000);
            }, 2000);
        });
    }
    
    addFloatingLabels() {
        // Les labels flottants sont déjà gérés en CSS
        // Mais on peut ajouter des effets supplémentaires ici
        this.formGroups.forEach(group => {
            const input = group.querySelector('input, textarea');
            
            input.addEventListener('focus', () => {
                group.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    group.classList.remove('focused');
                }
            });
        });
    }
}

// -------------------------------------
// 8. UTILITAIRES
// -------------------------------------
class Utils {
    // Debounce pour optimiser les performances
    static debounce(func, wait) {
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
    
    // Throttle pour limiter la fréquence d'exécution
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Vérifier si un élément est visible
    static isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Précharger les images
    static preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
}

// -------------------------------------
// 9. INITIALISATION GLOBALE
// -------------------------------------
class App {
    constructor() {
        this.managers = {
            loader: new LoaderManager(),
            cursor: new CustomCursor(),
            navigation: new NavigationManager(),
            scrollAnimations: new ScrollAnimations(),
            visualEffects: new VisualEffects(),
            form: new FormManager()
        };
    }
    
    init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }
    
    start() {
        console.log('🎨 Portfolio Photographe - Initialisation...');
        
        // Initialiser tous les managers
        Object.values(this.managers).forEach(manager => {
            if (manager.init) {
                manager.init();
            }
        });
        
        // Gérer le redimensionnement
        this.handleResize();
        
        // Ajouter les event listeners globaux
        this.addGlobalListeners();
        
        console.log('✅ Initialisation terminée !');
    }
    
    handleResize() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            // Mettre à jour l'état mobile
            APP_STATE.isMobile = window.innerWidth <= CONFIG.breakpoints.mobile;
            
            // Debounce pour optimiser les performances
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Actions à effectuer après le redimensionnement
                console.log('📐 Fenêtre redimensionnée');
            }, 250);
        });
    }
    
    addGlobalListeners() {
        // Empêcher le clic droit (optionnel)
        document.addEventListener('contextmenu', (e) => {
            // e.preventDefault();
        });
        
        // Gérer la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('👋 Page masquée');
            } else {
                console.log('👀 Page visible');
            }
        });
        
        // Performance monitoring (dev only)
        if (window.location.hostname === 'localhost') {
            window.addEventListener('load', () => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`⚡ Temps de chargement : ${pageLoadTime}ms`);
            });
        }
    }
}

// -------------------------------------
// 10. LANCEMENT DE L'APPLICATION
// -------------------------------------
const app = new App();
app.init();

// Exporter pour utilisation dans d'autres fichiers
window.PortfolioApp = {
    app,
    utils: Utils,
    state: APP_STATE,
    config: CONFIG
};