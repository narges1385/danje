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
        this.updateCategoryTitle();
    }

    // --- Load & Save ---
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
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(this.menuData)
            });
        } catch (error) {
            console.error('Error syncing to server:', error);
        }
    }

    // --- UI Updates ---
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
        let total = 0, active = 0, inactive = 0;
        Object.values(this.menuData).forEach(cat => {
            cat.forEach(item => {
                total++;
                item.active ? active++ : inactive++;
            });
        });

        document.getElementById('totalItems').textContent = total;
        document.getElementById('activeItems').textContent = active;
        document.getElementById('inactiveItems').textContent = inactive;
    }

    renderItemsList() {
        const container = document.getElementById('itemsList');
        const items = this.menuData[this.currentCategory] || [];
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = '<div class="empty-message">هیچ آیتمی در این دسته وجود ندارد</div>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'admin-item';
            const firstImg = item.images?.[0] || 'static/images/placeholder.jpg';
            const count = item.images?.length || 0;

            div.innerHTML = `
                <img src="${firstImg}" alt="${item.name}">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">${item.price.toLocaleString()} تومان</span>
                </div>
                <div class="item-images-count">${count} عکس</div>
                <span class="item-status ${item.active ? 'status-active' : 'status-inactive'}">
                    ${item.active ? 'فعال' : 'غیرفعال'}
                </span>
                <div class="item-actions">
                    <button class="btn-small btn-edit" onclick="adminManager.editItem(${item.id})">✏️ ویرایش</button>
                    <button class="btn-small btn-toggle" onclick="adminManager.toggleItemStatus(${item.id})">
                        ${item.active ? '🚫 غیرفعال' : '✅ فعال'}
                    </button>
                    <button class="btn-small btn-delete" onclick="adminManager.deleteItem(${item.id})">🗑️ حذف</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // --- Image Preview ---
    previewImage(event) {
        const files = event.target.files;
        const preview = document.getElementById('imagePreview');
        const info = document.getElementById('fileInfo');
        this.tempImages = [];
        preview.innerHTML = '';

        if (files.length === 0) {
            info.textContent = '';
            return;
        }

        info.textContent = `${files.length} فایل انتخاب شده`;
        Array.from(files).forEach((file, i) => {
            const reader = new FileReader();
            reader.onload = e => {
                const imgDiv = document.createElement('div');
                imgDiv.style.position = 'relative';
                imgDiv.style.display = 'inline-block';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `پیشنمایش ${i + 1}`;
                const remove = document.createElement('button');
                remove.textContent = '×';
                remove.className = 'remove-image';
                remove.onclick = () => this.removeImage(i);
                imgDiv.appendChild(img);
                imgDiv.appendChild(remove);
                preview.appendChild(imgDiv);
                this.tempImages.push(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    removeImage(i) {
        this.tempImages.splice(i, 1);
        this.updateImagePreview();
    }

    updateImagePreview() {
        const preview = document.getElementById('imagePreview');
        const info = document.getElementById('fileInfo');
        preview.innerHTML = '';
        info.textContent = `${this.tempImages.length} فایل انتخاب شده`;

        this.tempImages.forEach((imgData, i) => {
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.display = 'inline-block';
            const img = document.createElement('img');
            img.src = imgData;
            const remove = document.createElement('button');
            remove.textContent = '×';
            remove.className = 'remove-image';
            remove.onclick = () => this.removeImage(i);
            div.appendChild(img);
            div.appendChild(remove);
            preview.appendChild(div);
        });
    }

    // --- CRUD ---
    showAddItemForm() {
        document.getElementById('modalTitle').textContent = 'افزودن آیتم جدید';
        document.getElementById('itemForm').reset();
        document.getElementById('editItemId').value = '';
        document.getElementById('editItemCategory').value = this.currentCategory;
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('fileInfo').textContent = '';
        this.tempImages = [];
        document.getElementById('itemModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideItemForm() {
        document.getElementById('itemModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('editItemId').value;
        const category = document.getElementById('editItemCategory').value;
        const data = {
            name: document.getElementById('itemName').value,
            price: parseInt(document.getElementById('itemPrice').value),
            active: document.getElementById('itemActive').value === 'true',
            images: this.tempImages
        };

        if (id) this.updateItem(parseInt(id), category, data);
        else this.addItem(category, data);

        this.hideItemForm();
    }

    addItem(category, data) {
        const newItem = {id: Date.now(), ...data};
        this.menuData[category] = this.menuData[category] || [];
        this.menuData[category].push(newItem);
        this.saveMenuData();
        alert('آیتم با موفقیت افزوده شد!');
    }

    updateItem(id, category, data) {
        const items = this.menuData[category];
        const i = items.findIndex(it => it.id === id);
        if (i !== -1) {
            this.menuData[category][i] = {...this.menuData[category][i], ...data};
            this.saveMenuData();
            alert('آیتم با موفقیت ویرایش شد!');
        }
    }

    toggleItemStatus(id) {
        const items = this.menuData[this.currentCategory];
        const item = items.find(it => it.id === id);
        if (item) {
            item.active = !item.active;
            this.saveMenuData();
            alert(`آیتم ${item.active ? 'فعال' : 'غیرفعال'} شد!`);
        }
    }

    deleteItem(id) {
    if (confirm('آیا از حذف این آیتم مطمئنید؟')) {
        // حذف از localStorage
        this.menuData[this.currentCategory] = this.menuData[this.currentCategory].filter(it => it.id !== id);
        this.saveMenuData();

        // حذف از دیتابیس
        fetch(`/api/menu/${id}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(msg => {
            console.log(msg.message);
            alert('آیتم با موفقیت حذف شد!');
        })
        .catch(err => {
            console.error('خطا در حذف از سرور:', err);
            alert('خطا در حذف آیتم از سرور!');
        });
    }
}

    // --- Events ---
    setupEventListeners() {
        document.getElementById('itemForm').addEventListener('submit', e => this.handleFormSubmit(e));
        window.onclick = e => {
            const modal = document.getElementById('itemModal');
            if (e.target === modal) this.hideItemForm();
        };
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') this.hideItemForm();
        });
    }
}

// --- Export / Import ---
function exportData() {
    const data = JSON.stringify(window.adminManager.menuData, null, 2);
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
    link.download = 'danjeh-cafe-menu.json';
    link.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                window.adminManager.menuData = data;
                window.adminManager.saveMenuData();
                alert('داده با موفقیت وارد شد!');
            } catch {
                alert('خطا در وارد کردن داده! فایل معتبر نیست.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminMenuManager();
});
