class MenuDisplay {
    constructor() {
        this.menuData = null;
        this.currentSlideIndex = 0;
        this.currentProductImages = [];
        this.touchStartX = 0;
        this.touchEndX = 0;
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
        if (savedData) {
            this.menuData = JSON.parse(savedData);
        } else {
            // داده اولیه برای 10 دسته‌بندی
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
            container.innerHTML = '<div class="empty-message" style="color: #3d2315; border: 2px solid #5a341f; padding: 3vw; display: block; font-family: \'El Messiri\', sans-serif; font-size: 4vw;">آیتمی برای نمایش وجود ندارد</div>';
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
        if (!images || images.length === 0) {
            return '<img src="static/images/placeholder.jpg" alt="بدون عکس" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;">';
        }

        if (images.length === 1) {
            return `
                <div class="slideshow-container" data-product-id="${productId}">
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
                </div>
            `;
        }
    }

    attachSwipeEvents(container, productId) {
        const slideshow = container.querySelector('.slideshow-container');
        if (!slideshow) return;

        slideshow.addEventListener('touchstart', (e) => this.handleTouchStart(e, productId));
        slideshow.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        slideshow.addEventListener('touchend', (e) => this.handleTouchEnd(e, productId));
        slideshow.addEventListener('mousedown', (e) => this.handleMouseDown(e, productId));
        slideshow.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        slideshow.addEventListener('mouseup', (e) => this.handleMouseUp(e, productId));
        slideshow.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));

        const dots = slideshow.querySelectorAll('.slider-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(dot.dataset.index);
                this.showSlide(slideshow, index);
            });
        });
    }

    handleTouchStart(event, productId) { this.touchStartX = event.touches[0].clientX; event.preventDefault(); }
    handleTouchMove(event) { event.preventDefault(); }
    handleTouchEnd(event, productId) { this.touchEndX = event.changedTouches[0].clientX; this.handleSwipe(productId); event.preventDefault(); }
    handleMouseDown(event, productId) { this.isDragging = true; this.dragStartX = event.clientX; event.preventDefault(); }
    handleMouseMove(event) { if (!this.isDragging) return; event.preventDefault(); }
    handleMouseUp(event, productId) { 
        if (!this.isDragging) return; 
        const dragEndX = event.clientX;
        const dragDistance = this.dragStartX - dragEndX;
        if (Math.abs(dragDistance) > 50) dragDistance > 0 ? this.nextSlide(productId) : this.prevSlide(productId);
        this.isDragging = false; event.preventDefault(); 
    }
    handleMouseLeave(event) { this.isDragging = false; }
    handleSwipe(productId) {
        const swipeDistance = this.touchStartX - this.touchEndX;
        if (Math.abs(swipeDistance) > 50) swipeDistance > 0 ? this.nextSlide(productId) : this.prevSlide(productId);
    }

    prevSlide(productId) { this.changeSlide(productId, -1); }
    nextSlide(productId) { this.changeSlide(productId, 1); }

    changeSlide(productId, direction) {
        const container = document.querySelector(`.slideshow-container[data-product-id="${productId}"]`);
        if (!container) return;
        const slides = container.querySelectorAll('.slide');
        let currentIndex = Array.from(slides).findIndex(slide => slide.classList.contains('active'));
        currentIndex = (currentIndex + direction + slides.length) % slides.length;
        this.showSlide(container, currentIndex);
    }

    showSlide(container, index) {
        const slides = container.querySelectorAll('.slide');
        const dots = container.querySelectorAll('.slider-dot');
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
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

        this.imageModal.addEventListener('click', (e) => { if (e.target === this.imageModal) this.closeImageModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeImageModal();
            if (e.key === 'ArrowLeft') this.modalPrevSlide();
            if (e.key === 'ArrowRight') this.modalNextSlide();
        });
    }

    openImageModal(images, productName) {
        if (!images || images.length === 0) return;
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

    modalPrevSlide() { this.currentSlideIndex = (this.currentSlideIndex - 1 + this.currentProductImages.length) % this.currentProductImages.length; this.showModalSlide(this.currentSlideIndex); }
    modalNextSlide() { this.currentSlideIndex = (this.currentSlideIndex + 1) % this.currentProductImages.length; this.showModalSlide(this.currentSlideIndex); }
}

let menuDisplay;
document.addEventListener('DOMContentLoaded', () => { menuDisplay = new MenuDisplay(); });

// تب‌ها
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    document.getElementById(tabName + 'Btn').classList.add('active');
}

// اسکرول آیکون‌ها
function scrollIcons(amount) { document.getElementById('iconScroll').scrollBy({ left: amount, behavior: 'smooth' }); }

document.querySelectorAll('.iconlists a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        targetElement.scrollIntoView({ behavior: 'smooth' });

        const container = document.querySelector('.iconlists');
        const linkRect = link.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const scrollLeft = container.scrollLeft + (linkRect.left - containerRect.left) - (container.clientWidth / 2 - linkRect.width / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    });
});
