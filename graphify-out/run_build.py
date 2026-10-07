import sys, json
from graphify.build import build_from_json
from graphify.cluster import cluster, score_all
from graphify.analyze import god_nodes, surprising_connections, suggest_questions
from graphify.report import generate
from graphify.export import to_json, to_html
from pathlib import Path

def main():
    extraction = json.loads(Path('graphify-out/.graphify_extract.json').read_text(encoding="utf-8-sig"))
    detection  = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding="utf-8-sig"))

    G = build_from_json(extraction)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': extraction.get('input_tokens', 0), 'output': extraction.get('output_tokens', 0)}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)
    
    # Compute community meaningful labels based on node names and domain
    labels = {}
    for cid, nodes in communities.items():
        node_labels = [G.nodes[n].get('label', '') for n in nodes if n in G.nodes]
        combined = " ".join(node_labels).lower()
        if any(k in combined for k in ['pinecone', 'rag', 'cognitive', 'vector', 'embedding']):
            labels[cid] = "Cognitive RAG & Pinecone AI"
        elif any(k in combined for k in ['proctor', 'securityguard', 'malpractice', 'violation', 'fullscreen']):
            labels[cid] = "Security Guard & Proctoring Engine"
        elif any(k in combined for k in ['obe', 'copo', 'attainment', 'bloom', 'programoutcome', 'courseoutcome']):
            labels[cid] = "OBE Attainment & Bloom Analytics"
        elif any(k in combined for k in ['question', 'bank', 'paper', 'rubric', 'exam']):
            labels[cid] = "Question Bank & Paper Builder"
        elif any(k in combined for k in ['workstation', 'candidate', 'runner', 'sqlquery', 'round2coding', 'chatround4', 'businesscase', 'descriptivequestion']):
            labels[cid] = "Student Assessment Workstations & Runner"
        elif any(k in combined for k in ['sandbox', 'codeexecution', 'run_candidate_code', 'scoring_service']):
            labels[cid] = "Coding Sandbox & Execution Engine"
        elif any(k in combined for k in ['jwt', 'auth', 'token', 'login', 'permission', 'role', 'security']):
            labels[cid] = "Authentication & Access Control"
        elif any(k in combined for k in ['student', 'roster', 'faculty', 'approval', 'user', 'excel', 'import']):
            labels[cid] = "User Roster & Student Approvals"
        elif any(k in combined for k in ['mark', 'grade', 'evaluation', 'spreadsheet', 'result']):
            labels[cid] = "Evaluation & Mark Management"
        elif any(k in combined for k in ['assignment', 'submission', 'calendar', 'schedule']):
            labels[cid] = "Assignments & Academic Calendar"
        elif any(k in combined for k in ['navbar', 'sidebar', 'layout', 'app', 'dashboard', 'router']):
            labels[cid] = "Frontend Core UI & Dashboards"
        elif any(k in combined for k in ['config', 'database', 'seed', 'models', 'session']):
            labels[cid] = "Database Models & Configuration"
        elif any(k in combined for k in ['audit', 'log', 'report']):
            labels[cid] = "Audit Logs & Reporting Center"
        else:
            sample = [nl for nl in node_labels if len(nl) > 3][:2]
            labels[cid] = " & ".join(sample) if sample else f"Community {cid}"

    questions = suggest_questions(G, communities, labels)
    report = generate(G, communities, cohesion, labels, gods, surprises, detection, tokens, 'c:\\Users\\HP\\Desktop\\Assessment_Portal', suggested_questions=questions)
    Path('graphify-out/GRAPH_REPORT.md').write_text(report, encoding="utf-8")
    to_json(G, communities, 'graphify-out/graph.json', force=True)
    to_html(G, communities, 'graphify-out/graph.html', community_labels=labels or None)

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
        'labels': {str(k): v for k, v in labels.items()}
    }
    Path('graphify-out/.graphify_analysis.json').write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Graph built successfully: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")

if __name__ == '__main__':
    main()
