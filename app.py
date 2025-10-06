from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

# تابع کمکی برای دسترسی به دیتابیس
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


# نمایش صفحه ادمین
@app.route('/admin')
def admin_page():
    return render_template('admin.html')


# دریافت لیست منو برای ادمین (AJAX)
@app.route('/api/menu')
def get_menu():
    conn = get_db()
    items = conn.execute('SELECT * FROM menu_items').fetchall()
    conn.close()

    # دسته‌بندی آیتم‌ها
    categorized = {str(i): [] for i in range(1, 11)}
    for row in items:
        category = str(row['category'])
        if category in categorized:
            categorized[category].append(dict(row))

    return jsonify(categorized)

# افزودن آیتم جدید
@app.route('/api/menu', methods=['POST'])
def add_item():
    data = request.json
    conn = get_db()
    conn.execute('INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)',
                 (data['name'], data['price'], data['category']))
    conn.commit()
    conn.close()
    return jsonify({"message": "آیتم اضافه شد"})


# حذف آیتم
@app.route('/api/menu/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db()
    conn.execute('DELETE FROM menu_items WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "آیتم حذف شد"})
if __name__ == '__main__':
    app.run(debug=True)
