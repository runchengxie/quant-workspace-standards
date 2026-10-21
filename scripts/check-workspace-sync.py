#!/usr/bin/env python3
"""Compare shared Markdown rules without printing private local additions or writing files."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import sys


def sections(source):
    """Compare level-two sections and complete paragraph/list-item blocks, not wording heuristics."""
    result = {}
    current = "__preamble__"
    chunks = []
    buffer = []
    fenced = None

    def flush():
        if buffer:
            chunks.append('\n'.join(buffer).strip())
            buffer.clear()

    def save():
        flush()
        if current != "__preamble__" or chunks:
            if current in result:
                raise ValueError('duplicate_section_heading')
            result[current] = chunks.copy()
        chunks.clear()

    for line in source.splitlines():
        marker = re.match(r'^ {0,3}(`{3,}|~{3,})', line)
        if fenced:
            buffer.append(line.rstrip())
            if marker and marker[1][0] == fenced[0] and len(marker[1]) >= len(fenced) and not line[len(marker[0]):].strip():
                fenced = None
            continue
        if marker:
            fenced = marker[1]
            buffer.append(line.rstrip())
            continue
        if re.match(r'^#\s+', line):
            continue
        heading = re.match(r'^##\s+(.+?)\s*#*$', line)
        if heading:
            save()
            current = heading[1]
        elif current is not None:
            if not line.strip():
                flush()
            elif re.match(r'^(?:[-*+] |\d+\. )', line):
                flush()
                buffer.append(line.rstrip())
            else:
                buffer.append(line.rstrip())
    save()
    if not result:
        raise ValueError('no_shared_section_structure')
    return result


def compare(canonical, local):
    rows = []
    changed = False
    for title, rules in canonical.items():
        expected = Counter(rules)
        observed = Counter(local.get(title, []))
        missing = list((expected - observed).elements())
        additions = sum((observed - expected).values())
        status = 'missing' if title not in local else 'changed' if missing else 'aligned_with_local_additions' if additions else 'aligned'
        changed = changed or bool(missing) or title not in local
        rows.append({'heading': title, 'status': status, 'missing_rules': missing, 'local_addition_count': additions})
    return {'schema_version': 1, 'status': 'drift' if changed else 'aligned',
            'sections': rows, 'local_only_sections': [key for key in local if key not in canonical and key != '__preamble__'],
            'local_preamble_addition_count': len(local.get('__preamble__', [])) if '__preamble__' not in canonical else 0,
            'private_content': 'omitted', 'comparison': 'exact_blocks_within_level_two_sections'}, 1 if changed else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--canonical', required=True)
    parser.add_argument('--local', required=True)
    args = parser.parse_args()
    try:
        canonical = sections(Path(args.canonical).read_text(encoding='utf-8-sig'))
        local = sections(Path(args.local).read_text(encoding='utf-8-sig'))
        result, code = compare(canonical, local)
    except (OSError, UnicodeError, ValueError):
        result, code = {'schema_version': 1, 'status': 'unavailable', 'error': 'input_or_structure_unavailable'}, 2
    print(json.dumps(result, indent=2, ensure_ascii=True))
    return code


if __name__ == '__main__':
    sys.exit(main())
