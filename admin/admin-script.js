class AdminMenuManager {
    constructor() {
        this.currentCategory = '1';
        this.menuData = this.loadMenuData();
        this.tempImages = [];
        this.init();
    }

    init() {
        this.renderStats();
        this.renderItemsList();
        this.setupEventListeners();
    }

    loadMenuData() {
        const savedData = localStorage.getItem('danjehCafeMenuData');
        if (savedData) {
            return JSON.parse(savedData);
        } else {
            const emptyData = {
                '1': [], '2': [], '3': [], '4': [], '5': [],
                '6': [], '7': [], '8': [], '9': [], '10': []
            };
            localStorage.setItem('danjehCafeMenuData', JSON.stringify(emptyData));
            return emptyData;
        }
    }

    saveMenuData() {
        localStorage.setItem('danjehCafeMenuData', JSON.stringify(this.menuData));
        this.renderStats();
        this.renderItemsList();
        this.syncToServer();
    }

    async syncToServer() {
        try {
            await fetch('/api/admin/menu/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.menuData)
            });
        } catch (error) {
            console.error('Error syncing to server:', error);
        }
    }

    onCategoryChange() {
        this.currentCategory = document.getElementById('categorySelect').value;
        this.renderItemsList();
        this.updateCategoryTitle();
    }

    updateCategoryTitle() {
        const titles = {
            '1': 'نوشیدنی گرم بر پایه اسپرسو',
            '2': 'نوشیدنی سرد بر پایه اسپرسو',
            '3': 'چای',
            '4': 'دمنوش گیاهی',
            '5': 'میلک شیک',
            '6': 'ماکتیل',
            '7': 'نوشیدنی سرد',
            '8': 'اسموتی',
            '9': 'کیک و دسر',
            '10': 'صبحانه'
        };
        document.getElementById('currentCategoryTitle').textContent = 
            `آیتم‌های ${titles[this.currentCategory]}`;
    }

    renderStats() {
        let totalItems = 0;
        let activeItems = 0;
        let inactiveItems = 0;

        Object.values(this.menuData).forEach(category => {
            category.forEach(item => {
                totalItems++;
                if (item.active) {
                    activeItems++;
                } else {
                    inactiveItems++;
                }
            });
        });

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('activeItems').textContent = activeItems;
        document.getElementById('inactiveItems').textContent = inactiveItems;
    }

    renderItemsList() {
        const itemsList = document.getElementById('itemsList');
        const items = this.menuData[this.currentCategory] || [];

        if (items.length === 0) {
            itemsList.innerHTML = '<div class="empty-message">هیچ آیتمی در این دسته وجود ندارد</div>';
            return;
        }

        itemsList.innerHTML = '';

        items.forEach(item => {
            const itemElement = this.createAdminItemElement(item);
            itemsList.appendChild(itemElement);
        });
    }

    createAdminItemElement(item) {
        const div = document.createElement('div');
        div.className = 'admin-item';
        
        const firstImage = item.images && item.images.length > 0 ? item.images[0] : '../static/images/placeholder.jpg';
        const imagesCount = item.images ? item.images.length : 0;
        
        div.innerHTML = `
            <img src="${firstImage}" alt="${item.name}">
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-price">${item.price.toLocaleString()} تومان</span>
            </div>
            <div class="item-images-count">
                ${imagesCount} عکس
            </div>
            <span class="item-status ${item.active ? 'status-active' : 'status-inactive'}">
                ${item.active ? 'فعال' : 'غیرفعال'}
            </span>
            <div class="item-actions">
                <button class="btn-small btn-edit" onclick="adminManager.editItem(${item.id})">
                    ✏️ ویرایش
                </button>
                <button class="btn-small btn-toggle" onclick="adminManager.toggleItemStatus(${item.id})">
                    ${item.active ? '🚫 غیرفعال' : '✅ فعال'}
                </button>
                <button class="btn-small btn-delete" onclick="adminManager.deleteItem(${item.id})">
                    🗑️ حذف
                </button>
            </div>
        `;
        return div;
    }

    showAddItemForm() {
        document.getElementById('modalTitle').textContent = 'افزودن آیتم جدید';
        document.getElementById('itemForm').reset();
        document.getElementById('editItemId').value = '';
        document.getElementById('editItemCategory').value = this.currentCategory;
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('fileInfo').textContent = '';
        this.tempImages = [];
        document.getElementById('itemImage').multiple = true;
        document.getElementById('itemModal').style.display = 'block';
    }

    hideItemForm() {
        document.getElementById('itemModal').style.display = 'none';
    }

    previewImage(event) {
        const files = event.target.files;
        const previewContainer = document.getElementById('imagePreview');
        const fileInfo = document.getElementById('fileInfo');
        
        previewContainer.innerHTML = '';
        this.tempImages = [];
        
        if (files.length > 0) {
            fileInfo.textContent = `${files.length} فایل انتخاب شده`;
            
            for (let i = 0; i < files.length; i++) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.position = 'relative';
                    imgContainer.style.display = 'inline-block';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = `پیشنمایش ${i + 1}`;
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.textContent = '×';
                    removeBtn.className = 'remove-image';
                    removeBtn.onclick = () => this.removeImage(i);
                    
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(removeBtn);
                    previewContainer.appendChild(imgContainer);
                    
                    this.tempImages.push(e.target.result);
                };
                reader.readAsDataURL(files[i]);
            }
        } else {
            fileInfo.textContent = '';
        }
    }

    removeImage(index) {
        this.tempImages.splice(index, 1);
        this.updateImagePreview();
    }

    updateImagePreview() {
        const previewContainer = document.getElementById('imagePreview');
        const fileInfo = document.getElementById('fileInfo');
        
        previewContainer.innerHTML = '';
        fileInfo.textContent = `${this.tempImages.length} فایل انتخاب شده`;
        
        this.tempImages.forEach((image, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            imgContainer.style.display = 'inline-block';
            
            const img = document.createElement('img');
            img.src = image;
            img.alt = `پیشنمایش ${index + 1}`;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.className = 'remove-image';
            removeBtn.onclick = () => this.removeImage(index);
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            previewContainer.appendChild(imgContainer);
        });
    }

    editItem(itemId) {
        const items = this.menuData[this.currentCategory];
        const item = items.find(item => item.id === itemId);
        
        if (item) {
            document.getElementById('modalTitle').textContent = 'ویرایش آیتم';
            document.getElementById('editItemId').value = item.id;
            document.getElementById('editItemCategory').value = this.currentCategory;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemActive').value = item.active.toString();
            
            this.tempImages = item.images ? [...item.images] : [];
            this.updateImagePreview();
            
            document.getElementById('itemModal').style.display = 'block';
        }
    }

    handleFormSubmit(event) {
        event.preventDefault();
        
        const itemId = document.getElementById('editItemId').value;
        const category = document.getElementById('editItemCategory').value;
        
        const formData = {
            name: document.getElementById('itemName').value,
            price: parseInt(document.getElementById('itemPrice').value),
            active: document.getElementById('itemActive').value === 'true',
            images: this.tempImages
        };
        
        if (itemId) {
            this.updateItem(parseInt(itemId), category, formData);
        } else {
            this.addItem(category, formData);
        }
        
        this.hideItemForm();
    }

    addItem(category, itemData) {
        if (!this.menuData[category]) {
            this.menuData[category] = [];
        }
        
        const newItem = {
            id: Date.now(),
            ...itemData
        };
        
        this.menuData[category].push(newItem);
        this.saveMenuData();
        
        alert('آیتم با موفقیت افزوده شد!');
    }

    updateItem(itemId, category, newData) {
        const items = this.menuData[category];
        const itemIndex = items.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
            this.menuData[category][itemIndex] = {
                ...this.menuData[category][itemIndex],
                ...newData
            };
            this.saveMenuData();
            
            alert('آیتم با موفقیت ویرایش شد!');
        }
    }

    toggleItemStatus(itemId) {
        const items = this.menuData[this.currentCategory];
        const item = items.find(item => item.id === itemId);
        
        if (item) {
            item.active = !item.active;
            this.saveMenuData();
            
            alert(`آیتم ${item.active ? 'فعال' : 'غیرفعال'} شد!`);
        }
    }

    deleteItem(itemId) {
        if (confirm('آیا از حذف این آیتم مطمئنید؟')) {
            this.menuData[this.currentCategory] = this.menuData[this.currentCategory]
                .filter(item => item.id !== itemId);
            this.saveMenuData();
            
            alert('آیتم با موفقیت حذف شد!');
        }
    }

    setupEventListeners() {
        window.onclick = (event) => {
            const modal = document.getElementById('itemModal');
            if (event.target === modal) {
                this.hideItemForm();
            }
        };
    }
}

// توابع全局
function exportData() {
    const adminManager = window.adminManager;
    const dataStr = JSON.stringify(adminManager.menuData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'danjeh-cafe-menu.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const importedData = JSON.parse(event.target.result);
                window.adminManager.menuData = importedData;
                window.adminManager.saveMenuData();
                alert('داده با موفقیت وارد شد!');
            } catch (error) {
                alert('خطا در وارد کردن داده! فایل معتبر نیست.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// راه‌اندازی پنل مدیریت
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminMenuManager();
});
