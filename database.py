import sqlite3

conn = sqlite3.connect('cafe.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY,               -- شناسه اختصاصی از سمت پنل مدیریت
    name TEXT NOT NULL,                   -- نام آیتم
    price REAL NOT NULL,                  -- قیمت
    category TEXT,                        -- دسته‌بندی
    active BOOLEAN DEFAULT 1,             -- وضعیت فعال/غیرفعال
    image TEXT                            -- لیست عکس‌ها به صورت رشته جداشده با کاما
)
''')

conn.commit()
conn.close()
