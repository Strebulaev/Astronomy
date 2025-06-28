import os
import argparse
from typing import List, Optional

def generate_directory_tree(
    root_dir: str,
    include_dirs: Optional[List[str]] = None,
    exclude_dirs: Optional[List[str]] = None,
    recursive: bool = True,
    show_files: bool = True,
    indent_size: int = 4
) -> str:
    """
    Генерирует дерево каталогов с возможностью фильтрации.
    
    :param root_dir: Корневая директория для сканирования
    :param include_dirs: Список включаемых поддиректорий (None - все)
    :param exclude_dirs: Список исключаемых поддиректорий
    :param recursive: Рекурсивный обход поддиректорий
    :param show_files: Показывать файлы
    :param indent_size: Размер отступа для каждого уровня
    :return: Строка с древовидной структурой
    """
    exclude_dirs = exclude_dirs or []
    include_dirs = include_dirs or []
    
    tree = []
    prefix = []
    
    def _scan_dir(current_dir: str, level: int):
        indent = ' ' * indent_size * level
        dir_name = os.path.basename(current_dir)
        tree.append(f"{indent}{dir_name}/")
        
        try:
            with os.scandir(current_dir) as entries:
                entries = sorted(entries, key=lambda e: (e.is_file(), e.name))
                
                for entry in entries:
                    if entry.is_dir():
                        if (not include_dirs or entry.name in include_dirs) and entry.name not in exclude_dirs:
                            if recursive:
                                _scan_dir(entry.path, level + 1)
                            else:
                                tree.append(f"{indent}{' ' * indent_size}{entry.name}/")
                    elif show_files and entry.is_file():
                        tree.append(f"{indent}{' ' * indent_size}{entry.name}")
        except PermissionError:
            tree.append(f"{indent}[Permission Denied]")
    
    _scan_dir(root_dir, 0)
    return '\n'.join(tree)

def main():
    parser = argparse.ArgumentParser(description='Генератор структуры папок с фильтрацией')
    parser.add_argument('path', help='Путь к корневой папке')
    parser.add_argument('--include', nargs='+', help='Включаемые подпапки (только эти)')
    parser.add_argument('--exclude', nargs='+', help='Исключаемые подпапки')
    parser.add_argument('--no-recursive', action='store_false', dest='recursive', help='Не рекурсивный обход')
    parser.add_argument('--no-files', action='store_false', dest='show_files', help='Не показывать файлы')
    parser.add_argument('-o', '--output', help='Файл для сохранения результата')
    
    args = parser.parse_args()
    
    if not os.path.isdir(args.path):
        print(f"Ошибка: '{args.path}' не существует или не является папкой")
        return
    
    tree = generate_directory_tree(
        root_dir=args.path,
        include_dirs=args.include,
        exclude_dirs=args.exclude,
        recursive=args.recursive,
        show_files=args.show_files
    )
    
    print("\nСтруктура папок:\n")
    print(tree)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(tree)
        print(f"\nРезультат сохранён в: {args.output}")

if __name__ == "__main__":
    main()