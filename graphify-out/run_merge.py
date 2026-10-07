import json
from pathlib import Path

def main():
    ast_path = Path('graphify-out/.graphify_ast.json')
    if ast_path.exists():
        ast = json.loads(ast_path.read_text(encoding='utf-8-sig'))
    else:
        ast = {'nodes': [], 'edges': []}

    sem_path = Path('graphify-out/.graphify_semantic.json')
    if sem_path.exists():
        try:
            sem = json.loads(sem_path.read_text(encoding='utf-8-sig'))
        except Exception:
            sem = {'nodes': [], 'edges': [], 'hyperedges': []}
    else:
        sem = {'nodes': [], 'edges': [], 'hyperedges': []}

    seen = {n['id'] for n in ast.get('nodes', [])}
    merged_nodes = list(ast.get('nodes', []))
    for n in sem.get('nodes', []):
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged_edges = list(ast.get('edges', [])) + list(sem.get('edges', []))
    merged_hyperedges = sem.get('hyperedges', [])

    # Add core system rationale/architecture nodes if missing
    system_nodes = [
        {
            "id": "architecture_assessment_portal",
            "label": "AI-Powered Adaptive Assessment & OBE Portal Architecture",
            "file_type": "rationale",
            "source_file": "Prompt and rules.txt",
            "source_location": "System Overview",
            "source_url": None,
            "captured_at": None,
            "author": None,
            "contributor": None,
            "rationale": "Comprehensive institutional assessment platform with OBE attainment calculation, Bloom taxonomy analytics, AI Question generation via Pinecone Cognitive RAG, and multi-layered browser security and proctoring."
        },
        {
            "id": "obe_attainment_engine",
            "label": "Outcome-Based Education (OBE) & CO-PO Attainment Calculation Engine",
            "file_type": "rationale",
            "source_file": "backend/app/routers/obe.py",
            "source_location": "CO/PO Calculation",
            "source_url": None,
            "captured_at": None,
            "author": None,
            "contributor": None,
            "rationale": "Calculates Course Outcome (CO) and Program Outcome (PO) direct and indirect attainments, Bloom taxonomy distribution, and gap analysis for accreditation (NBA/NAAC)."
        },
        {
            "id": "proctoring_pipeline",
            "label": "Browser Security Guard & Proctoring Pipeline",
            "file_type": "rationale",
            "source_file": "frontend/src/components/assessment/SecurityGuard.tsx",
            "source_location": "Proctoring Core",
            "source_url": None,
            "captured_at": None,
            "author": None,
            "contributor": None,
            "rationale": "Real-time client-side security guard (fullscreen enforcement, tab-switch monitoring, context menu and copy-paste restriction, window blur detection) coupled with server-side violation logging and snapshot audits."
        },
        {
            "id": "cognitive_rag_pinecone",
            "label": "Cognitive RAG & Pinecone Vector Knowledge Engine",
            "file_type": "rationale",
            "source_file": "backend/app/ai/cognitive_rag_engine.py",
            "source_location": "AI Engine",
            "source_url": None,
            "captured_at": None,
            "author": None,
            "contributor": None,
            "rationale": "Vector embeddings and similarity search via Pinecone / Gemini embeddings for syllabus parsing, textbook indexing, Bloom-aligned question bank generation, and semantic duplicate detection."
        }
    ]

    for sn in system_nodes:
        if sn['id'] not in seen:
            merged_nodes.append(sn)
            seen.add(sn['id'])

    merged = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': merged_hyperedges,
        'input_tokens': sem.get('input_tokens', 0),
        'output_tokens': sem.get('output_tokens', 0),
    }

    Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"Extraction merged: {len(merged_nodes)} nodes, {len(merged_edges)} edges")

if __name__ == '__main__':
    main()
