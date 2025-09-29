class MenuDisplay {
    constructor() {
        this.menuData = null;
        this.currentSlideIndex = 0;
        this.currentProductImages = [];
        this.init();
    }

    async init() {
        await this.loadMenuData();
        this.renderAllCategories();
        this.initImageModal();
        
        setInterval(() => {
            this.loadMenuData().then(() => this.renderAllCategories());
        }, 30000);
    }

    async loadMenuData() {
        try {
            const response = await fetch('/api/menu');
            if (response.ok) {
                this.menuData = await response.json();
            } else {
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading menu data:', error);
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('danjehCafeMenuData');
        if (savedData) {
            this.menuData = JSON.parse(savedData);
        } else {
            this.menuData = {
                '1': [], '2': [], '3': [], '4': [], '5': [],
                '6': [], '7': [], '8': [], '9': [], '10': []
            };
        }
    }

    renderAllCategories() {
        for (let i = 1; i <= 10; i++) {
            this.renderCategory(i.toString());
        }
    }

    renderCategory(categoryId) {
        const container = document.querySelector(`.menu1[data-category-id="${categoryId}"] .product-list`);
        if (!container) return;

        const items = this.menuData[categoryId] || [];
        const activeItems = items.filter(item => item.active);

        container.innerHTML = '';

        if (activeItems.length === 0) {
            container.innerHTML = '<div class="empty-message">آیتمی برای نمایش وجود ندارد</div>';
            return;
        }

        activeItems.forEach(item => {
            const itemElement = this.createItemElement(item);
            container.appendChild(itemElement);
        });
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = 'product';
        
        const imagesHTML = this.createProductGallery(item.images, item.name, item.id);
        
        div.innerHTML = `
            <div class="product-gallery">
                ${imagesHTML}
            </div>
            <h3>${item.name}</h3>
            <p class="price">${item.price.toLocaleString()} تومان</p>
        `;
        
        // اضافه کردن event listener برای باز کردن مودال
        const galleryContainer = div.querySelector('.slideshow-container');
        if (galleryContainer) {
            galleryContainer.addEventListener('click', () => {
                this.openImageModal(item.images, item.name);
            });
        }
        
        return div;
    }

    createProductGallery(images, productName, productId) {
        if (!images || images.length === 0) {
            return '<img src="../static/images/placeholder.jpg" alt="بدون عکس">';
        }
        
        if (images.length === 1) {
            return `
                <div class="slideshow-container">
                    <div class="slide active">
                        <img src="${images[0]}" alt="${productName}">
                    </div>
                </div>
            `;
        } else {
            let slidesHTML = '';
            let dotsHTML = '';
            
            images.forEach((image, index) => {
                const activeClass = index === 0 ? 'active' : '';
                slidesHTML += `
                    <div class="slide ${activeClass}">
                        <img src="${image}" alt="${productName} - تصویر ${index + 1}">
                    </div>
                `;
                
                dotsHTML += `<button class="slider-dot ${activeClass}" data-index="${index}"></button>`;
            });
            
            return `
                <div class="slideshow-container" data-product-id="${productId}">
                    ${slidesHTML}
                    <div class="slider-arrows">
                        <button class="arrow prev" onclick="event.stopPropagation(); menuDisplay.prevSlide(${productId})">&#10094;</button>
                        <button class="arrow next" onclick="event.stopPropagation(); menuDisplay.nextSlide(${productId})">&#10095;</button>
                    </div>
                    <div class="slider-nav">
                        ${dotsHTML}
                    </div>
                    <div class="gallery-indicator" onclick="event.stopPropagation(); menuDisplay.openImageModal(${JSON.stringify(images).replace(/"/g, '&quot;')}, '${productName}')">
                        +${images.length - 1} عکس دیگر
                    </div>
                </div>
            `;
        }
    }

    prevSlide(productId) {
        const container = document.querySelector(`.slideshow-container[data-product-id="${productId}"]`);
        if (!container) return;
        
        const slides = container.querySelectorAll('.slide');
        const dots = container.querySelectorAll('.slider-dot');
        let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
        
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        this.showSlide(container, currentIndex);
    }

    nextSlide(productId) {
        const container = document.querySelector(`.slideshow-container[data-product-id="${productId}"]`);
        if (!container) return;
        
        const slides = container.querySelectorAll('.slide');
        const dots = container.querySelectorAll('.slider-dot');
        let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
        
        currentIndex = (currentIndex + 1) % slides.length;
        this.showSlide(container, currentIndex);
    }

    showSlide(container, index) {
        const slides = container.querySelectorAll('.slide');
        const dots = container.querySelectorAll('.slider-dot');
        
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    initImageModal() {
        this.imageModal = document.getElementById('imageModal');
        this.modalSlideshow = this.imageModal.querySelector('.slideshow');
        this.modalPrev = this.imageModal.querySelector('.prev');
        this.modalNext = this.imageModal.querySelector('.next');
        this.modalClose = this.imageModal.querySelector('.close');
        this.dotsContainer = this.imageModal.querySelector('.dots-container');
        
        this.modalClose.addEventListener('click', () => this.closeImageModal());
        this.modalPrev.addEventListener('click', () => this.modalPrevSlide());
        this.modalNext.addEventListener('click', () => this.modalNextSlide());
        
        // بستن مودال با کلیک خارج
        this.imageModal.addEventListener('click', (e) => {
            if (e.target === this.imageModal) {
                this.closeImageModal();
            }
        });
        
        // بستن با کلید ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeImageModal();
            }
        });
    }

    openImageModal(images, productName) {
        if (!images || images.length === 0) return;
        
        this.currentProductImages = images;
        this.currentSlideIndex = 0;
        
        this.updateModalSlideshow();
        this.imageModal.style.display = 'block';
        
        // جلوگیری از اسکرول body
        document.body.style.overflow = 'hidden';
    }

    closeImageModal() {
        this.imageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    updateModalSlideshow() {
        this.modalSlideshow.innerHTML = '';
        this.dotsContainer.innerHTML = '';
        
        this.currentProductImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = `slide ${index === 0 ? 'active' : ''}`;
            slide.innerHTML = `<img src="${image}" alt="تصویر ${index + 1}">`;
            this.modalSlideshow.appendChild(slide);
            
            const dot = document.createElement('span');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.showModalSlide(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    showModalSlide(index) {
        this.currentSlideIndex = index;
        const slides = this.modalSlideshow.querySelectorAll('.slide');
        const dots = this.dotsContainer.querySelectorAll('.dot');
        
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[this.currentSlideIndex].classList.add('active');
        dots[this.currentSlideIndex].classList.add('active');
    }

    modalPrevSlide() {
        this.currentSlideIndex = (this.currentSlideIndex - 1 + this.currentProductImages.length) % this.currentProductImages.length;
        this.showModalSlide(this.currentSlideIndex);
    }

    modalNextSlide() {
        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.currentProductImages.length;
        this.showModalSlide(this.currentSlideIndex);
    }
}

// تابع برای تب‌ها
function showTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tabs button');
    
    tabContents.forEach(content => {
        content.style.display = 'none';
    });
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    document.getElementById(tabName).style.display = 'block';
    document.getElementById(tabName + 'Btn').classList.add('active');
}

// راه‌اندازی
let menuDisplay;
document.addEventListener('DOMContentLoaded', () => {
    menuDisplay = new MenuDisplay();
});
