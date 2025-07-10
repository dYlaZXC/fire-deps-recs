import json

# Загрузка JSON-файла
with open("gos_lands_in_buffer_2.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Удаляем поле 'geometry_wkt' из каждого словаря
for item in data:
    item.pop("limitations", None)

# Сохраняем в новый файл
with open("gos_lands_in_buffer_2_new.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
