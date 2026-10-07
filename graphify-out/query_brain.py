#!/usr/bin/env python3
"""
Assessment Portal Brain (Graphify Query Engine)
Acts as the central knowledge brain for the Assessment Portal codebase.
Provides instant lookup for routes, models, components, AI proctoring engines,
OBE calculations, and relational dependency graph without full-codebase grep.
"""

import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

GRAPH_PATH = Path(__file__).parent / "graph.json" if (Path(__file__).parent / "graph.json").exists() else Path("graphify-out/graph.json")
DETECT_PATH = Path(__file__).parent / ".graphify_detect.json" if (Path(__file__).parent / ".graphify_detect.json").exists() else Path("graphify-out/.graphify_detect.json")
REPORT_PATH = Path(__file__).parent / "GRAPH_REPORT.md" if (Path(__file__).parent / "GRAPH_REPORT.md").exists() else Path("graphify-out/GRAPH_REPORT.md")


def load_graph() -> Dict[str, Any]:
    if not GRAPH_PATH.exists():
        raise FileNotFoundError(f"Knowledge graph not found at {GRAPH_PATH}. Run graphify build first.")
    with open(GRAPH_PATH, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def search_nodes(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Find nodes matching query terms in label, id, or source file."""
    data = load_graph()
    nodes = data.get("nodes", [])
    terms = [t.lower() for t in query.strip().split() if t]
    
    scored = []
    for node in nodes:
        label = node.get("label", "").lower()
        nid = str(node.get("id", "")).lower()
        src = node.get("source_file", "").lower()
        rationale = str(node.get("rationale", "")).lower()
        
        score = 0
        for t in terms:
            if t == label or t == nid:
                score += 10
            elif t in label:
                score += 5
            elif t in nid:
                score += 3
            elif t in src:
                score += 2
            elif t in rationale:
                score += 2
                
        if score > 0:
            scored.append((score, node))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:limit]]


def get_node_details(node_id_or_label: str) -> Optional[Dict[str, Any]]:
    """Retrieve complete metadata and 1-hop connections for a node."""
    data = load_graph()
    nodes = {str(n["id"]): n for n in data.get("nodes", [])}
    links = data.get("links", [])
    
    target_id = None
    target_node = None
    
    # Exact ID match
    if node_id_or_label in nodes:
        target_id = node_id_or_label
        target_node = nodes[node_id_or_label]
    else:
        # Match by label
        query_lower = node_id_or_label.lower()
        for nid, n in nodes.items():
            if n.get("label", "").lower() == query_lower:
                target_id = nid
                target_node = n
                break
        if not target_id:
            # Substring match
            for nid, n in nodes.items():
                if query_lower in n.get("label", "").lower() or query_lower in nid.lower():
                    target_id = nid
                    target_node = n
                    break
                    
    if not target_node:
        return None
        
    outgoing = []
    incoming = []
    
    for link in links:
        source = str(link.get("source", ""))
        target = str(link.get("target", ""))
        rel = link.get("relation", "connected_to")
        conf = link.get("confidence", "EXTRACTED")
        
        if source == target_id:
            tgt_node = nodes.get(target, {"label": target, "source_file": "unknown"})
            outgoing.append({
                "target_id": target,
                "target_label": tgt_node.get("label", target),
                "relation": rel,
                "confidence": conf,
                "source_file": tgt_node.get("source_file", "")
            })
        elif target == target_id:
            src_node = nodes.get(source, {"label": source, "source_file": "unknown"})
            incoming.append({
                "source_id": source,
                "source_label": src_node.get("label", source),
                "relation": rel,
                "confidence": conf,
                "source_file": src_node.get("source_file", "")
            })
            
    return {
        "node": target_node,
        "outgoing_connections": outgoing,
        "incoming_connections": incoming
    }


def get_architecture_overview() -> Dict[str, Any]:
    """Provides high-level system components and community breakdown."""
    data = load_graph()
    nodes = data.get("nodes", [])
    links = data.get("links", [])
    
    communities = {}
    for n in nodes:
        cid = n.get("community", 0)
        cname = n.get("community_name", f"Community {cid}")
        if cname not in communities:
            communities[cname] = []
        communities[cname].append(n.get("label", n.get("id")))
        
    return {
        "total_nodes": len(nodes),
        "total_edges": len(links),
        "total_communities": len(communities),
        "communities": {cname: f"{len(members)} nodes (e.g. {', '.join(members[:4])})" for cname, members in communities.items()}
    }


def query(q: str):
    print(f"\n🧠 [ASSESSMENT PORTAL BRAIN QUERY]: '{q}'")
    results = search_nodes(q, limit=8)
    if not results:
        print("  ❌ No matching nodes found in the knowledge graph.")
        return
        
    print(f"  Found {len(results)} relevant components/symbols:\n")
    for idx, r in enumerate(results, 1):
        label = r.get("label", r.get("id"))
        src = r.get("source_file", "unknown")
        loc = r.get("source_location", "")
        ftype = r.get("file_type", "code")
        rationale = r.get("rationale", "")
        
        loc_str = f" @ {loc}" if loc else ""
        print(f"  [{idx}] {label} ({ftype})")
        print(f"      File: {src}{loc_str}")
        if rationale:
            print(f"      Rationale/Context: {rationale}")
            
        details = get_node_details(r.get("id"))
        if details:
            out_c = details["outgoing_connections"]
            inc_c = details["incoming_connections"]
            if out_c:
                top_out = [f"{c['relation']} -> {c['target_label']}" for c in out_c[:4]]
                print(f"      Calls/Uses: {', '.join(top_out)}")
            if inc_c:
                top_in = [f"{c['source_label']} -> {c['relation']}" for c in inc_c[:4]]
                print(f"      Used By: {', '.join(top_in)}")
        print()


def main():
    parser = argparse.ArgumentParser(description="Query the Assessment Portal Brain Knowledge Graph")
    parser.add_argument("query", nargs="?", default="", help="Query string or concept to look up")
    parser.add_argument("--overview", action="store_true", help="Print system architecture overview")
    parser.add_argument("--explain", type=str, help="Get in-depth explanation of a specific symbol/node")
    args = parser.parse_args()
    
    if args.overview:
        overview = get_architecture_overview()
        print("\n🧠 [ASSESSMENT PORTAL ARCHITECTURAL OVERVIEW]")
        print(f"Nodes: {overview['total_nodes']} | Edges: {overview['total_edges']} | Communities: {overview['total_communities']}\n")
        for cname, info in overview["communities"].items():
            print(f"  • {cname}: {info}")
        print()
    elif args.explain:
        details = get_node_details(args.explain)
        if not details:
            print(f"Node '{args.explain}' not found.")
        else:
            n = details["node"]
            print(f"\n🧠 Node: {n.get('label', n.get('id'))}")
            print(f"   Source File: {n.get('source_file')}")
            print(f"   Type: {n.get('file_type')}")
            if n.get('rationale'):
                print(f"   Rationale: {n.get('rationale')}")
            print(f"\n   Outgoing Edges ({len(details['outgoing_connections'])}):")
            for c in details["outgoing_connections"]:
                print(f"     --[{c['relation']}]--> {c['target_label']} ({c['source_file']})")
            print(f"\n   Incoming Edges ({len(details['incoming_connections'])}):")
            for c in details["incoming_connections"]:
                print(f"     <--[{c['relation']}]-- {c['source_label']} ({c['source_file']})")
            print()
    elif args.query:
        query(args.query)
    else:
        overview = get_architecture_overview()
        print("\n🧠 Assessment Portal Brain ready. Use `python graphify-out/query_brain.py <query>` or `--overview` / `--explain <node>`")
        print(f"Knowledge Graph: {overview['total_nodes']} symbols indexed across {overview['total_communities']} architectural domains.")


if __name__ == "__main__":
    main()
