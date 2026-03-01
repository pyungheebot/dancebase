#!/usr/bin/env python3
"""
src/hooks/ 디렉토리에서 중복 localStorage 헬퍼 함수를 제거하고
@/lib/local-storage import로 교체하는 스크립트

전략:
- 내부 함수(loadData/saveData/persistData/loadFromStorage/saveToStorage)를 제거
- 제거된 함수가 사용하던 localStorage 키와 기본값을 추출
- 호출부를 loadFromStorage/saveToStorage 호출로 교체
- STORAGE_KEY 상수가 없으면 생성
- import 추가
"""

import os
import re
import sys

HOOKS_DIR = "/home/laco/dancebase/src/hooks"


def find_balanced_braces_end(content: str, start: int) -> int:
    """start({) 부터 매칭되는 } 이후 인덱스 반환"""
    depth = 0
    i = start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def extract_function_body(content: str, func_name: str) -> str | None:
    """함수 본문 텍스트 추출"""
    pattern = re.compile(r'(?m)^[ \t]*function ' + re.escape(func_name) + r'\b')
    match = pattern.search(content)
    if not match:
        return None

    brace_pos = content.find('{', match.start())
    if brace_pos == -1:
        return None

    end = find_balanced_braces_end(content, brace_pos)
    if end == -1:
        return None

    return content[brace_pos:end]


def find_function_range(content: str, func_name: str) -> tuple | None:
    """
    함수 + 그 위의 주석/빈줄의 (start, end) 반환
    """
    pattern = re.compile(r'(?m)^([ \t]*)function ' + re.escape(func_name) + r'\b')
    match = pattern.search(content)
    if not match:
        return None

    func_keyword_start = match.start()

    # 함수 본문 끝 찾기
    brace_pos = content.find('{', func_keyword_start)
    if brace_pos == -1:
        return None

    func_end = find_balanced_braces_end(content, brace_pos)
    if func_end == -1:
        return None

    # 함수 위 주석/빈줄 역방향 탐색
    before = content[:func_keyword_start]
    before_lines = before.split('\n')

    comment_line_count = 0
    for line in reversed(before_lines):
        stripped = line.strip()
        if (stripped == '' or
            stripped.startswith('//') or
            stripped.startswith('/*') or
            stripped.startswith('*') or
            stripped == '*/'):
            comment_line_count += 1
        else:
            break

    if comment_line_count > 0:
        keep_lines = before_lines[:len(before_lines) - comment_line_count]
        remove_start = len('\n'.join(keep_lines))
        if keep_lines:
            remove_start += 1  # 마지막 keep line 이후의 \n
    else:
        remove_start = func_keyword_start

    # 함수 끝 이후 \n 하나
    end = func_end
    if end < len(content) and content[end] == '\n':
        end += 1

    return (remove_start, end)


def extract_storage_key_from_body(body: str) -> str | None:
    """함수 본문에서 localStorage key 추출"""
    # 멀티라인 대응: localStorage.getItem( 이후 key 추출
    # 1) 백틱: `...` (멀티라인 포함)
    m = re.search(r'localStorage\.\w+\(\s*(`[^`]+`)', body, re.DOTALL)
    if m:
        # 멀티라인 백틱 → 단일 라인으로 정리
        key = m.group(1)
        key = re.sub(r'\s*\n\s*', '', key)
        return key
    # 2) 단따옴표
    m = re.search(r"localStorage\.\w+\(\s*('(?:[^'\\]|\\.)*')", body)
    if m:
        return m.group(1)
    # 3) 쌍따옴표
    m = re.search(r'localStorage\.\w+\(\s*("(?:[^"\\]|\\.)*")', body)
    if m:
        return m.group(1)
    # 4) 대문자 상수명 (예: STORAGE_KEY, STORAGE_KEY(id))
    m = re.search(r'localStorage\.\w+\(\s*([A-Z_][A-Z_0-9]*(?:\([^)]*\))?)\s*\)', body)
    if m:
        return m.group(1)
    # 5) 함수 호출 (예: getStorageKey(x), swrKeys.foo(x), LS_KEY(x))
    #    setItem/getItem 첫 번째 인자 - , 또는 ) 로 끝남
    m = re.search(r'localStorage\.\w+\(\s*([\w.]+\s*\([^)]*\))\s*[,)]', body)
    if m:
        return m.group(1)
    # 6) 단순 변수명
    m = re.search(r'localStorage\.\w+\(\s*([a-zA-Z_][\w.]*)\s*[,)]', body)
    if m:
        return m.group(1)
    return None


def extract_default_from_load_body(body: str) -> str:
    """loadData 함수 본문에서 기본값 추출"""
    # return [] 또는 return {} 또는 return { ... } 형태
    m = re.search(r'\breturn\s+(\[\]|\{\}|\{[^}]*\})', body)
    if m:
        val = m.group(1).strip()
        # 너무 길면 [] 사용
        if len(val) > 50:
            return '[]'
        return val
    return '[]'


def get_func_params(content: str, func_name: str) -> list:
    """함수 파라미터 이름 목록 반환"""
    pattern = re.compile(r'(?m)^[ \t]*function ' + re.escape(func_name) + r'\s*\(([^)]*)\)')
    match = pattern.search(content)
    if not match:
        return []
    params_str = match.group(1)
    params = []
    for p in params_str.split(','):
        p = p.strip()
        # TypeScript 타입 제거: param: Type → param
        if ':' in p:
            p = p[:p.index(':')].strip()
        if p:
            params.append(p)
    return params


def get_func_return_type(content: str, func_name: str) -> str | None:
    """함수 반환 타입 추출"""
    # function foo(params): ReturnType { 패턴
    # 멀티라인 반환 타입 ({...})은 처리하지 않음
    pattern = re.compile(
        r'(?m)^[ \t]*function ' + re.escape(func_name) + r'\s*\([^)]*\)\s*:\s*(.+?)\s*\{'
    )
    match = pattern.search(content)
    if not match:
        return None
    ret = match.group(1).strip().rstrip(':').strip()
    # 복잡한 타입 (중괄호 등) 제외
    if '{' in ret or '(' in ret:
        return None
    return ret


def remove_function_with_range(content: str, func_name: str) -> tuple[str, dict | None]:
    """함수를 제거하고 메타 정보 반환"""
    body = extract_function_body(content, func_name)
    if body is None:
        return content, None

    storage_key = extract_storage_key_from_body(body)
    default_val = extract_default_from_load_body(body) if 'load' in func_name.lower() else None
    params = get_func_params(content, func_name)

    result = find_function_range(content, func_name)
    if result is None:
        return content, None

    start, end = result
    new_content = content[:start] + content[end:]

    return new_content, {
        'storage_key': storage_key,
        'default_val': default_val,
        'params': params,
        'body': body,
    }


def is_key_func_reference(key_template: str) -> bool:
    """key_template이 함수 호출 또는 변수 참조인지 확인"""
    # 백틱, 따옴표로 시작하지 않으면 함수/변수 참조
    return not key_template.startswith('`') and not key_template.startswith("'") and not key_template.startswith('"')


def ensure_storage_key_const(content: str, key_template: str, params: list) -> tuple[str, str]:
    """
    STORAGE_KEY 상수가 없으면 추가하고 키 호출 표현식 반환.
    key_template: 실제 키 문자열 또는 함수 호출 (예: `dancebase:activity-reports:${groupId}`, getStorageKey(x))
    params: 함수 파라미터 이름들
    반환: (수정된_content, 키_표현식)
    """
    # key_template이 이미 함수/변수 참조이면 그대로 사용
    if is_key_func_reference(key_template):
        return content, key_template

    # 이미 STORAGE_KEY 상수가 있는지 확인
    if re.search(r'\bSTORAGE_KEY\b', content):
        # 파라미터에 맞춰 호출 표현식 결정
        if params:
            return content, f'STORAGE_KEY({", ".join(params)})'
        return content, 'STORAGE_KEY'

    # 없으면 생성
    # key_template에서 ${xxx} 패턴을 파라미터로 대체
    template_params = re.findall(r'\$\{([^}]+)\}', key_template)

    if not template_params and not params:
        # 정적 키
        key_const = f'const STORAGE_KEY = {key_template};'
        key_call = 'STORAGE_KEY'
    elif len(params) == 1:
        # 단일 파라미터
        param = params[0]
        # template에서 실제 변수명을 param으로 교체
        normalized = key_template
        for tp in template_params:
            normalized = normalized.replace(f'${{{tp}}}', f'${{{param}}}')
        key_const = f'const STORAGE_KEY = ({param}: string) => {normalized};'
        key_call = f'STORAGE_KEY({param})'
    else:
        # 복수 파라미터
        param_decls = ', '.join(f'{p}: string' for p in params)
        normalized = key_template
        for i, tp in enumerate(template_params):
            if i < len(params):
                normalized = normalized.replace(f'${{{tp}}}', f'${{{params[i]}}}')
        key_const = f'const STORAGE_KEY = ({param_decls}) => {normalized};'
        key_call = f'STORAGE_KEY({", ".join(params)})'

    # STORAGE_KEY를 훅 함수 위에 추가 (첫 번째 export function 또는 function 위에)
    export_match = re.search(r'(?m)^export function \w+', content)
    top_level_func_match = re.search(r'(?m)^function \w+', content)

    insert_match = export_match or top_level_func_match
    if insert_match:
        pos = insert_match.start()
        content = content[:pos] + key_const + '\n\n' + content[pos:]
    else:
        content = key_const + '\n\n' + content

    return content, key_call


def get_appropriate_default(return_type: str | None, raw_default: str) -> str:
    """반환 타입에 맞는 기본값 결정"""
    if not return_type:
        return raw_default
    # 배열 타입이면 []
    if return_type.endswith('[]') or return_type.startswith('Array<'):
        return '[]'
    # 기타 객체 타입이면 {} as T
    if raw_default in ('[]', '{}'):
        return f'{{}} as {return_type}'
    return raw_default


def replace_call_site(content: str, old_func: str, new_func: str,
                       key_call: str, default_val: str = '[]',
                       save_params: list = None, return_type: str = None) -> str:
    """
    호출부 교체.
    - loadData(x) → loadFromStorage<T>(key_call, default_val)
    - saveData(x, data) → saveToStorage(key_call, data)
    - persistData(data) → saveToStorage(key_call, data)
    """
    if old_func in ('loadData', 'loadFromStorage'):
        # loadFunc(params) → loadFromStorage<T>(key_call, default_val)
        type_param = f'<{return_type}>' if return_type else ''
        actual_default = get_appropriate_default(return_type, default_val)
        pattern = re.compile(r'\b' + re.escape(old_func) + r'\s*\(([^)]*)\)')
        content = pattern.sub(
            f'{new_func}{type_param}({key_call}, {actual_default})',
            content
        )
    elif old_func in ('saveData', 'saveToStorage'):
        # saveData(id, data) → saveToStorage(key_call, data)
        # saveToStorage(id, data) → saveToStorage(STORAGE_KEY(id), data) [내부 함수였던 경우]
        # save_params는 [id_param, data_param] 형태
        if save_params and len(save_params) >= 2:
            # saveXxx(id, data) 형태: 첫 번째 인자를 key_call로 변환
            pattern = re.compile(
                r'\b' + re.escape(old_func) + r'\s*\(([^,)]+),\s*([^)]+)\)'
            )
            content = pattern.sub(
                lambda m: f'{new_func}({key_call}, {m.group(2).strip()})',
                content
            )
        else:
            # saveXxx(data) 형태
            pattern = re.compile(r'\b' + re.escape(old_func) + r'\s*\(([^)]+)\)')
            content = pattern.sub(
                f'{new_func}({key_call}, \\1)',
                content
            )
    elif old_func in ('persistData',):
        # persistData(groupId, projectId, data) 또는 persistData(data)
        if save_params and len(save_params) >= 2:
            pattern = re.compile(
                r'\b' + re.escape(old_func) + r'\s*\((?:[^,)]+,\s*)*([^)]+)\)'
            )
            content = pattern.sub(
                lambda m: f'{new_func}({key_call}, {m.group(1).strip()})',
                content
            )
        else:
            pattern = re.compile(r'\b' + re.escape(old_func) + r'\s*\(([^)]+)\)')
            content = pattern.sub(
                lambda m: f'{new_func}({key_call}, {m.group(1).strip()})',
                content
            )

    return content


def replace_localStorage_removeItem(content: str) -> tuple[str, bool]:
    new_content = re.sub(
        r'localStorage\.removeItem\(([^)]+)\)',
        r'removeFromStorage(\1)',
        content
    )
    return new_content, new_content != content


def add_import(content: str, imports_needed: set) -> str:
    if not imports_needed:
        return content
    if '@/lib/local-storage' in content:
        return content

    import_parts = sorted(imports_needed)
    import_line = f'import {{ {", ".join(import_parts)} }} from "@/lib/local-storage";'

    import_matches = list(re.finditer(r'^import .+;$', content, re.MULTILINE))
    if import_matches:
        last_import = import_matches[-1]
        insert_pos = last_import.end()
        return content[:insert_pos] + '\n' + import_line + content[insert_pos:]

    use_client = content.find('"use client";')
    if use_client >= 0:
        nl = content.index('\n', use_client)
        return content[:nl+1] + '\n' + import_line + '\n' + content[nl+1:]

    return import_line + '\n' + content


SKIP_FILES = {
    'use-equipment-inventory.ts',  # 멀티라인 반환 타입으로 수동 처리
    'use-culture-alignment.ts',    # 복잡한 기본값으로 수동 처리
}


def process_file(filepath: str) -> tuple[bool, str]:
    fname = os.path.basename(filepath)
    if fname in SKIP_FILES:
        return False, "manual_only"

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    if '@/lib/local-storage' in content:
        return False, "already_imported"

    # 처리할 함수 목록
    func_configs = [
        ('loadData', 'loadFromStorage'),
        ('saveData', 'saveToStorage'),
        ('persistData', 'saveToStorage'),
        ('loadFromStorage', 'loadFromStorage'),  # 내부 정의 (시그니처 다름)
        ('saveToStorage', 'saveToStorage'),      # 내부 정의 (시그니처 다름)
    ]

    removed_meta = {}  # func_name → meta

    for old_func, new_func in func_configs:
        # 제거 전에 반환 타입 추출 (원본 content에서)
        return_type = get_func_return_type(content, old_func)
        new_content, meta = remove_function_with_range(content, old_func)
        if meta is not None:
            content = new_content
            if meta and return_type:
                meta['return_type'] = return_type
            removed_meta[old_func] = meta

    if not removed_meta and 'localStorage.removeItem' not in content:
        return False, "no_internal_functions"

    # 키 정보 결합 (loadData와 saveData 중 하나에서 키 추출)
    storage_key_template = None
    default_val = '[]'
    load_params = []
    save_params = []

    for fn in ('loadData', 'loadFromStorage'):
        if fn in removed_meta:
            meta = removed_meta[fn]
            if meta['storage_key']:
                storage_key_template = meta['storage_key']
            if meta['default_val']:
                default_val = meta['default_val']
            load_params = meta['params']
            break

    for fn in ('saveData', 'persistData', 'saveToStorage'):
        if fn in removed_meta:
            meta = removed_meta[fn]
            if not storage_key_template and meta['storage_key']:
                storage_key_template = meta['storage_key']
            save_params = meta['params']
            break

    # STORAGE_KEY 상수 확인 및 생성
    key_call = None
    all_params = load_params or save_params

    if storage_key_template:
        content, key_call = ensure_storage_key_const(
            content, storage_key_template, all_params
        )
    elif re.search(r'\bSTORAGE_KEY\b', content):
        # 파일에 이미 STORAGE_KEY가 있으면 그대로 사용
        if all_params:
            key_call = f'STORAGE_KEY({all_params[0]})'
        else:
            key_call = 'STORAGE_KEY'

    # 호출부 교체
    if key_call:
        for old_func, new_func in func_configs:
            if old_func in removed_meta:
                if old_func in ('loadData', 'loadFromStorage'):
                    meta = removed_meta[old_func]
                    ret_type = meta.get('return_type')
                    content = replace_call_site(content, old_func, 'loadFromStorage',
                                               key_call, default_val, return_type=ret_type)
                elif old_func in ('saveData', 'persistData', 'saveToStorage'):
                    meta = removed_meta[old_func]
                    content = replace_call_site(content, old_func, 'saveToStorage',
                                               key_call, default_val, meta['params'])

    # localStorage.removeItem 교체
    content, remove_changed = replace_localStorage_removeItem(content)

    # import 결정
    imports_needed = set()
    if any(f in removed_meta for f in ('loadData', 'loadFromStorage')):
        imports_needed.add('loadFromStorage')
    if any(f in removed_meta for f in ('saveData', 'persistData', 'saveToStorage')):
        imports_needed.add('saveToStorage')
    if remove_changed:
        imports_needed.add('removeFromStorage')

    content = add_import(content, imports_needed)

    # 연속 빈 줄 정리
    content = re.sub(r'\n{3,}', '\n\n', content)

    if content == original:
        return False, "no_effective_change"

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return True, f"removed={set(removed_meta.keys())}, imports={imports_needed}"


def main():
    if len(sys.argv) > 1:
        files = [os.path.join(HOOKS_DIR, sys.argv[1])]
    else:
        files = []
        for fname in os.listdir(HOOKS_DIR):
            if fname.endswith('.ts') or fname.endswith('.tsx'):
                files.append(os.path.join(HOOKS_DIR, fname))

    modified = []
    skipped = []
    errors = []

    for fpath in sorted(files):
        try:
            changed, reason = process_file(fpath)
            if changed:
                modified.append((fpath, reason))
            else:
                skipped.append((fpath, reason))
        except Exception as e:
            import traceback
            errors.append((fpath, str(e), traceback.format_exc()))

    print(f"\n=== 결과 ===")
    print(f"수정됨: {len(modified)}개")
    print(f"건너뜀: {len(skipped)}개")
    print(f"오류: {len(errors)}개")

    if modified:
        print(f"\n수정된 파일:")
        for f, r in modified:
            print(f"  OK {os.path.basename(f)}: {r}")

    if errors:
        print(f"\n오류 발생 파일:")
        for f, e, tb in errors:
            print(f"  ERR {os.path.basename(f)}: {e}")
            print(tb)


if __name__ == "__main__":
    main()
