from typing import Dict, Any, List, Tuple

class ScoringService:
    """Deterministic server-side scoring, readiness level computation and radar analytics."""

    def calculate_readiness_level(self, percentage: float) -> str:
        if percentage >= 85.0:
            return "Advanced"
        elif percentage >= 70.0:
            return "Proficient"
        elif percentage >= 50.0:
            return "Developing"
        else:
            return "Needs Improvement"

    def evaluate_pass_fail(self, percentage: float, passing_score: float) -> bool:
        return percentage >= passing_score

    def derive_strengths_and_gaps(self, competency_scores: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
        strengths = []
        gaps = []
        
        assessed_comps = [c for c in competency_scores if c.get("max_score", 0) > 0 or c.get("score", 0) > 0]
        
        for comp in assessed_comps:
            pct = comp.get("percentage", 0.0)
            name = comp.get("competency_name", comp.get("name", "Competency"))
            if pct >= 70.0:
                strengths.append(f"{name} ({pct:.0f}%)")
            elif pct < 60.0:
                gaps.append(f"{name} ({pct:.0f}%)")
        
        unique_strengths = list(dict.fromkeys(strengths))
        unique_gaps = list(dict.fromkeys(gaps))

        if not unique_strengths:
            unique_strengths = ["Awaiting assessment clearance on core competencies"]
        if not unique_gaps:
            unique_gaps = ["No major deficiency identified in completed rounds"]
            
        return unique_strengths, unique_gaps

scoring_service = ScoringService()
