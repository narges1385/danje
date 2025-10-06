import sqlite3

conn = sqlite3.connect('cafe.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    image TEXT
)
''')

conn.commit()
conn.close()
