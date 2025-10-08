from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# تابع کمکی برای اتصال به دیتابیس
def get_db():
    conn = sqlite3.connect('cafe.db')
    conn.row_factory = sqlite3.Row
    return conn

# نمایش منو برای مشتری
@app.route('/')
def menu():
    conn = get_db()
    items = conn.execute('SELECT * FROM menu_items').fetchall()
    conn.close()
    return render_template('menu.html', items=items)

# نمایش صفحه مدیریت
@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# دریافت منو به صورت دسته‌بندی‌شده برای نمایش در منو و پنل مدیریت
@app.route('/api/menu')
def get_menu():
    conn = get_db()
    items = conn.execute('SELECT * FROM menu_items').fetchall()
    conn.close()

    categorized = {str(i): [] for i in range(1, 11)}
    for row in items:
        category = str(row['category'])
        if category in categorized:
            categorized[category].append(dict(row))

    return jsonify(categorized)

# افزودن آیتم جدید (در صورت نیاز به افزودن تکی)
@app.route('/api/menu', methods=['POST'])
def add_item():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO menu_items (name, price, category, active, image) VALUES (?, ?, ?, ?, ?)',
                 (
                     data['name'],
                     data['price'],
                     data['category'],
                     data.get('active', True),
                     ','.join(data.get('images', []))
                 ))
    conn.commit()
    conn.close()
    return jsonify({"message": "آیتم اضافه شد"})

# حذف آیتم با بررسی وجود
@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db()
    cursor = conn.execute('DELETE FROM menu_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({"message": "آیتمی با این شناسه پیدا نشد"}), 404
    return jsonify({"message": "آیتم حذف شد"})

# همگام‌سازی کل منو از پنل مدیریت
@app.route('/api/admin/menu/sync', methods=['POST'])
def sync_menu():
    data = request.json
    conn = get_db()

    # پاک‌سازی کل جدول قبل از درج جدید
    conn.execute('DELETE FROM menu_items')

    for category, items in data.items():
        for item in items:
            conn.execute('INSERT INTO menu_items (id, name, price, category, active, image) VALUES (?, ?, ?, ?, ?, ?)',
                         (
                             item['id'],
                             item['name'],
                             item['price'],
                             category,
                             item.get('active', True),
                             ','.join(item.get('images', []))
                         ))
    conn.commit()
    conn.close()
    return jsonify({"message": "منو با موفقیت همگام‌سازی شد"})

if __name__ == '__main__':
    app.run(debug=True)