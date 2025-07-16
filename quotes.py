import os
import yaml
from pathlib import Path

def fix_quotes_in_yaml(file_path):
    abs_path = Path(file_path).absolute()
    
    if not abs_path.exists():
        print(f"Ошибка: файл {abs_path} не найден")
        return

    # Читаем файл как текст для сохранения оригинального форматирования
    with open(abs_path, 'r', encoding='utf-8') as file:
        content = file.read()

    # Обрабатываем каждую запись отдельно
    entries = content.split('\n- ')
    processed_entries = []
    
    for i, entry in enumerate(entries):
        if i == 0:
            # Первая запись может начинаться без '- '
            if entry.startswith('- '):
                entry = entry[2:]
            processed_entries.append(process_entry(entry))
        else:
            processed_entries.append('- ' + process_entry(entry))

    # Собираем обратно
    fixed_content = '\n'.join(processed_entries)

    # Проверяем валидность YAML
    try:
        yaml.safe_load(fixed_content)
    except yaml.YAMLError as e:
        print(f"Ошибка валидации YAML: {e}")
        print("Создаю резервную копию и сохраняю изменения...")
        backup_path = abs_path.with_suffix('.yml.bak')
        with open(backup_path, 'w', encoding='utf-8') as backup:
            backup.write(content)
        print(f"Создана резервная копия: {backup_path}")

    # Сохраняем изменения
    with open(abs_path, 'w', encoding='utf-8') as file:
        file.write(fixed_content)
    print(f"Файл {abs_path} успешно обработан")

def process_entry(entry):
    lines = entry.split('\n')
    processed_lines = []
    
    for line in lines:
        if ': "' in line and line.count('"') >= 2:
            # Обрабатываем только строки с кавычками
            key, value = line.split(': "', 1)
            if value.endswith('"'):
                value = value[:-1]
                # Заменяем внутренние кавычки
                processed_value = value.replace('"', "'")
                line = f'{key}: "{processed_value}"'
        processed_lines.append(line)
    
    return '\n'.join(processed_lines)

if __name__ == "__main__":
    file_path = input("Введите относительный путь к YAML файлу: ")
    fix_quotes_in_yaml(file_path)