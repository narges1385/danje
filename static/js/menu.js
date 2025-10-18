class MenuDisplay {
    constructor() {
        this.menuData = null;
        this.currentSlideIndexMap = {}; // نگه داشتن اسلاید فعلی برای هر محصول
        this.currentProductImages = [];
        this.isDragging = false;
        this.dragStartX = 0;
        this.init();
    }

    async init() {
        await this.loadMenuData();
        this.renderAllCategories();
        this.initImageModal();

        // رفرش خودکار هر 30 ثانیه
        setInterval(async () => {
            await this.loadMenuData();
            this.renderAllCategories();
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
        if (savedData) this.menuData = JSON.parse(savedData);
        else this.menuData = { '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': [], '10': [] };
    }

    renderAllCategories() {
        for (let i = 1; i <= 10; i++) this.renderCategory(i.toString());
    }

    renderCategory(categoryId) {
        const container = document.querySelector(`.menu1[data-category-id="${categoryId}"] .product-list`);
        if (!container) return;

        const items = this.menuData[categoryId] || [];
        const activeItems = items.filter(item => item.active);

        container.innerHTML = '';

        if (!activeItems.length) {
            container.innerHTML = '<div class="empty-message" style="color: #3d2315; border: 2px solid #5a341f; padding: 3vw ; display: block; font-family: \'El Messiri\', sans-serif; font-size: 4vw;">آیتمی برای نمایش وجود ندارد</div>';
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
        div.style.cssText = `
            background: #84735f;
            padding: 4vw;
            margin: 2vw 0;
            border-radius: 15px;
            border: 2px solid #5a341f;
            font-family: 'El Messiri', sans-serif;
            color: #3d2315;
            overflow: hidden;
            text-align: center;
            font-size: 6vw;
        `;

        const imagesHTML = this.createProductGallery(item.images, item.name, item.id);
        div.innerHTML = `
            <div class="product-gallery">
                ${imagesHTML}
            </div>
            <div class="product-info">
                <h3 class="product-name">${item.name}</h3>
                <p class="product-price">${item.price.toLocaleString()} تومان</p>
            </div>
        `;

        this.attachSwipeEvents(div, item.id);
        return div;
    }

    createProductGallery(images, productName, productId) {
        if (!images || !images.length) {
            return '<img src="static/images/placeholder.jpg" alt="بدون عکس" style="width:100%;height:200px;object-fit:cover;border-radius:10px;">';
        }

        if (images.length === 1) {
            return `<div class="slideshow-container" data-product-id="${productId}"><div class="slide active"><img src="${images[0]}" alt="${productName}"></div></div>`;
        }

        let slidesHTML = '';
        let dotsHTML = '';
        images.forEach((image, index) => {
            const activeClass = index === 0 ? 'active' : '';
            slidesHTML += `<div class="slide ${activeClass}"><img src="${image}" alt="${productName} - تصویر ${index+1}"></div>`;
            dotsHTML += `<button class="slider-dot ${activeClass}" data-index="${index}"></button>`;
        });

        this.currentSlideIndexMap[productId] = 0; // مقدار اولیه اسلاید هر محصول

        return `
            <div class="slideshow-container" data-product-id="${productId}">
                ${slidesHTML}
                <div class="slider-arrows">
                    <button class="arrow prev" onclick="event.stopPropagation(); menuDisplay.prevSlide(${productId})">&#10094;</button>
                    <button class="arrow next" onclick="event.stopPropagation(); menuDisplay.nextSlide(${productId})">&#10095;</button>
                </div>
                <div class="slider-nav">${dotsHTML}</div>
            </div>
        `;
    }

    attachSwipeEvents(container, productId) {
        const slideshow = container.querySelector('.slideshow-container');
        if (!slideshow || slideshow.dataset.listenerAdded) return;

        let touchStartX = 0, touchEndX = 0;

        slideshow.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
        slideshow.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const dist = touchStartX - touchEndX;
            if (Math.abs(dist) > 50) dist > 0 ? this.nextSlide(productId) : this.prevSlide(productId);
        });

        slideshow.addEventListener('mousedown', (e) => { this.isDragging = true; this.dragStartX = e.clientX; });
        slideshow.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            const dragDistance = this.dragStartX - e.clientX;
            if (Math.abs(dragDistance) > 50) dragDistance > 0 ? this.nextSlide(productId) : this.prevSlide(productId);
            this.isDragging = false;
        });
        slideshow.addEventListener('mouseleave', () => this.isDragging = false);

        // dots
        const dots = slideshow.querySelectorAll('.slider-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(dot.dataset.index);
                this.showSlide(slideshow, productId, index);
            });
        });

        slideshow.dataset.listenerAdded = true; // جلوگیری از attach دوباره
    }

    prevSlide(productId) { this.changeSlide(productId, -1); }
    nextSlide(productId) { this.changeSlide(productId, 1); }

    changeSlide(productId, step) {
        const container = document.querySelector(`.slideshow-container[data-product-id="${productId}"]`);
        if (!container) return;
        const slides = container.querySelectorAll('.slide');
        let currentIndex = this.currentSlideIndexMap[productId] || 0;
        currentIndex = (currentIndex + step + slides.length) % slides.length;
        this.showSlide(container, productId, currentIndex);
    }

    showSlide(container, productId, index) {
        const slides = container.querySelectorAll('.slide');
        const dots = container.querySelectorAll('.slider-dot');
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        this.currentSlideIndexMap[productId] = index;
    }

    // Image modal
    initImageModal() {
        this.imageModal = document.getElementById('imageModal');
        if (!this.imageModal) return;
        this.modalSlideshow = this.imageModal.querySelector('.slideshow');
        this.modalPrev = this.imageModal.querySelector('.prev');
        this.modalNext = this.imageModal.querySelector('.next');
        this.modalClose = this.imageModal.querySelector('.close');
        this.dotsContainer = this.imageModal.querySelector('.dots-container');

        this.modalClose.addEventListener('click', () => this.closeImageModal());
        this.modalPrev.addEventListener('click', () => this.modalPrevSlide());
        this.modalNext.addEventListener('click', () => this.modalNextSlide());
        this.imageModal.addEventListener('click', (e) => { if (e.target === this.imageModal) this.closeImageModal(); });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeImageModal();
            if (e.key === 'ArrowLeft') this.modalPrevSlide();
            if (e.key === 'ArrowRight') this.modalNextSlide();
        });
    }

    openImageModal(images) {
        if (!images || !images.length) return;
        this.currentProductImages = images;
        this.currentSlideIndex = 0;
        this.updateModalSlideshow();
        this.imageModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeImageModal() { this.imageModal.style.display = 'none'; document.body.style.overflow = 'auto'; }

    updateModalSlideshow() {
        this.modalSlideshow.innerHTML = '';
        this.dotsContainer.innerHTML = '';
        this.currentProductImages.forEach((img, idx) => {
            const slide = document.createElement('div');
            slide.className = `slide ${idx === 0 ? 'active' : ''}`;
            slide.innerHTML = `<img src="${img}" alt="تصویر ${idx+1}">`;
            this.modalSlideshow.appendChild(slide);

            const dot = document.createElement('span');
            dot.className = `dot ${idx === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => this.showModalSlide(idx));
            this.dotsContainer.appendChild(dot);
        });
    }

    showModalSlide(index) {
        this.currentSlideIndex = index;
        const slides = this.modalSlideshow.querySelectorAll('.slide');
        const dots = this.dotsContainer.querySelectorAll('.dot');
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    modalPrevSlide() { this.showModalSlide((this.currentSlideIndex-1 + this.currentProductImages.length) % this.currentProductImages.length); }
    modalNextSlide() { this.showModalSlide((this.currentSlideIndex+1) % this.currentProductImages.length); }
}

// تب‌ها
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display='none');
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).style.display='block';
    document.getElementById(tabName+'Btn').classList.add('active');
}

// اسکرول آیکون‌ها
function scrollIcons(amount) {
    document.getElementById('iconScroll').scrollBy({ left: amount, behavior: 'smooth' });
}

document.querySelectorAll('.iconlists a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        targetElement.scrollIntoView({ behavior: 'smooth' });
        const container = document.querySelector('.iconlists');
        const linkRect = link.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft + (linkRect.left - containerRect.left) - (container.clientWidth/2 - linkRect.width/2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    });
});

// راه‌اندازی
let menuDisplay;
document.addEventListener('DOMContentLoaded', () => { menuDisplay = new MenuDisplay(); });
