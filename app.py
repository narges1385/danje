from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

DATA_FILE = "data/menu.json"

# ------------------ مسیر صفحه مشتری ------------------
@app.route('/')
def menu_page():
    return render_template('menu.html')

# ------------------ مسیر صفحه مدیر ------------------
@app.route('/admin')
def admin_page():
    return render_template('admin.html')

# ------------------ گرفتن منو ------------------
@app.route('/api/menu', methods=['GET'])
def get_menu():
    if not os.path.exists(DATA_FILE):
        return jsonify({})
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return jsonify(json.load(f))

# ------------------ ذخیره منو ------------------
@app.route('/api/menu', methods=['POST'])
def save_menu():
    os.makedirs("data", exist_ok=True)  # اطمینان از وجود پوشه data
    data = request.json
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({"status": "success"})

# ------------------ اجرای برنامه ------------------
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
