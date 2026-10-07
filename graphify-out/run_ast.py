import json
from graphify.extract import collect_files, extract
from graphify.detect import detect
from pathlib import Path

def main():
    root = Path('.')
    detected = detect(root)
    code_file_paths = [str(Path(p).resolve()) for p in detected.get('files', {}).get('code', [])]
    doc_file_paths = [str(Path(p).resolve()) for p in detected.get('files', {}).get('document', [])]
    image_file_paths = [str(Path(p).resolve()) for p in detected.get('files', {}).get('image', [])]

    detect_dict = {
        'files': {
            'code': code_file_paths,
            'document': doc_file_paths,
            'paper': [],
            'image': image_file_paths,
            'video': []
        },
        'total_files': detected.get('total_files', 0),
        'total_words': detected.get('total_words', 0),
        'needs_graph': True,
        'scan_root': str(root.resolve())
    }
    Path('graphify-out/.graphify_detect.json').write_text(json.dumps(detect_dict, indent=2, ensure_ascii=False), encoding='utf-8')

    code_files = [Path(f) for f in code_file_paths if Path(f).exists()]
    if code_files:
        result = extract(code_files)
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
        n_nodes = len(result.get('nodes', []))
        n_edges = len(result.get('edges', []))
        print(f"AST: {n_nodes} nodes, {n_edges} edges across {len(code_files)} files")
    else:
        Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}, ensure_ascii=False), encoding='utf-8')
        print("No code files - skipping AST extraction")

if __name__ == '__main__':
    main()

