from flask import Flask, render_template, jsonify, request
import os, json

app = Flask(__name__)

DATA_FILE = 'data/menu.json'

# بارگذاری منو
def load_menu():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({'1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': [], '10': []}, f)
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_menu(menu_data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(menu_data, f, ensure_ascii=False, indent=2)

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/api/menu', methods=['GET'])
def api_menu():
    return jsonify(load_menu())

@app.route('/api/admin/menu/sync', methods=['POST'])
def sync_menu():
    menu_data = request.get_json()
    save_menu(menu_data)
    return jsonify({'status': 'success'})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)))
