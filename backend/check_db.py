import sqlite3

con = sqlite3.connect("platform.db")
cur = con.cursor()
print("Tables:", [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()])
print("Users:", cur.execute("SELECT id, email, full_name, role FROM users").fetchall())
print("Assessments:", cur.execute("SELECT id, title, status, created_by FROM assessments").fetchall())
con.close()
