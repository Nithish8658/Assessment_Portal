import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Standard IoT Hardware Domain Competency Codes
COMPETENCY_CODES = {
    "MCU": "IOT_MCU_ARCH",
    "BUS": "IOT_BUS_PROTOCOLS",
    "SENSOR": "IOT_SENSOR_AFE",
    "POWER": "IOT_POWER_ISOLATION",
    "ACTUATOR": "IOT_ACTUATOR_DRIVE"
}

class HardwareEvaluator:
    """
    Deterministic evaluation engine for IoT Hardware Component Selection and Placement.
    Calculates score based on:
        Score = (Number of correctly placed required components / Total number of required components) * 100
        Marks = (Correct Required Components / Total Required Components) * max_marks
    Also maps placement correctness across the 5 core domain competencies:
        1. IOT_MCU_ARCH: Microcontroller & Compute Architecture Selection
        2. IOT_BUS_PROTOCOLS: Serial, Differential & Industrial Bus Interfacing
        3. IOT_SENSOR_AFE: Sensor Front-End, Transducers & Signal Conditioning
        4. IOT_POWER_ISOLATION: Power Domain Management & Galvanic Isolation
        5. IOT_ACTUATOR_DRIVE: Actuator Interfacing, Power Switching & Suppression
    """

    @staticmethod
    def map_placement_to_competency(slot_id: str, comp_id: str) -> str:
        s = (slot_id or "").upper()
        c = (comp_id or "").upper()

        if "MCU" in s or "CORE" in s or "ESP32" in c or "STM32" in c or "RP2040" in c or "SAMD21" in c or "NODEMCU" in c or "ESP8266" in c:
            return "IOT_MCU_ARCH"
        if "POWER" in s or "BMS" in s or "SOLAR" in s or "ISOLAT" in s or "MPPT" in c or "DCDC" in c or "BUCK" in c or "SMPS" in c or "TPS62840" in c or "BARRIER" in c:
            return "IOT_POWER_ISOLATION"
        if "ACTUATOR" in s or "RELAY" in s or "SSR" in s or "LOAD" in s or "TRIAC" in c or "MOSFET" in c or "SOLENOID" in c or "VALVE" in c:
            return "IOT_ACTUATOR_DRIVE"
        if "BUS" in s or "COM" in s or "DISPLAY" in s or "OLED" in c or "MAX485" in c or "RS485" in c or "CAN" in c or "LORA" in c or "SX1276" in c or "DALI" in c or "SDI12" in c:
            return "IOT_BUS_PROTOCOLS"
        # Default to Sensor AFE
        return "IOT_SENSOR_AFE"

    @classmethod
    def evaluate_placement(
        cls,
        eval_config_rules: Dict[str, Any],
        candidate_payload: Any,
        max_marks: float = 1.0
    ) -> Dict[str, Any]:
        """
        Evaluates candidate's motherboard slot placements.
        
        :param eval_config_rules: Dictionary containing 'required_placements', 'total_required_count', etc.
        :param candidate_payload: Raw or parsed JSON payload submitted by the student.
                                  Expected format: list of dicts [{"slot_id": "...", "component_id": "..."}]
                                  or dict {"placements": [...]}
        :param max_marks: Maximum marks assigned to this assessment question.
        :return: Dict containing score, percentage, earned marks, status breakdown per slot, and competency scores.
        """
        # 1. Parse candidate submission payload
        placements_list: List[Dict[str, Any]] = []
        if isinstance(candidate_payload, str):
            try:
                parsed = json.loads(candidate_payload)
                if isinstance(parsed, list):
                    placements_list = parsed
                elif isinstance(parsed, dict):
                    placements_list = parsed.get("placements") or parsed.get("submitted_placements") or []
            except Exception as e:
                logger.warning(f"Failed to parse candidate hardware payload JSON: {e}")
                placements_list = []
        elif isinstance(candidate_payload, list):
            placements_list = candidate_payload
        elif isinstance(candidate_payload, dict):
            placements_list = candidate_payload.get("placements") or candidate_payload.get("submitted_placements") or []

        # Build candidate slot map: { slot_id: component_id }
        submission_map: Dict[str, str] = {}
        for item in placements_list:
            if isinstance(item, dict):
                slot = item.get("slot_id")
                comp = item.get("component_id")
                if slot and comp:
                    submission_map[str(slot).strip()] = str(comp).strip()

        # 2. Extract ground truth required placements
        required_placements = eval_config_rules.get("required_placements") or []
        total_required = eval_config_rules.get("total_required_count") or len(required_placements)

        # Initialize tracking for all 5 core IoT competencies
        competency_tracking: Dict[str, Dict[str, Any]] = {
            "IOT_MCU_ARCH": {"name": "Microcontroller & Compute Architecture Selection", "category": "Hardware Architecture", "correct": 0, "total": 0, "score": 0.0, "max_score": 0.0},
            "IOT_BUS_PROTOCOLS": {"name": "Serial, Differential & Industrial Bus Interfacing", "category": "Buses & Communications", "correct": 0, "total": 0, "score": 0.0, "max_score": 0.0},
            "IOT_SENSOR_AFE": {"name": "Sensor Front-End, Transducers & Signal Conditioning", "category": "Sensing & AFE", "correct": 0, "total": 0, "score": 0.0, "max_score": 0.0},
            "IOT_POWER_ISOLATION": {"name": "Power Domain Management & Galvanic Isolation", "category": "Power & Electrical Safety", "correct": 0, "total": 0, "score": 0.0, "max_score": 0.0},
            "IOT_ACTUATOR_DRIVE": {"name": "Actuator Interfacing, Power Switching & Suppression", "category": "Actuation & Control", "correct": 0, "total": 0, "score": 0.0, "max_score": 0.0}
        }

        if total_required <= 0:
            return {
                "score_percentage": 0.0,
                "earned_marks": 0.0,
                "correct_count": 0,
                "total_required": 0,
                "is_passed": False,
                "eval_note": "No required hardware placements configured.",
                "breakdown": [],
                "competency_scores": competency_tracking
            }

        marks_per_item = max_marks / total_required if total_required > 0 else 0.0
        correct_count = 0
        detailed_breakdown: List[Dict[str, Any]] = []

        # 3. Evaluate each required placement exactly once
        for req in required_placements:
            target_slot = str(req.get("slot_id", "")).strip()
            expected_comp = str(req.get("expected_component_id", "")).strip()
            slot_label = req.get("description") or req.get("slot_label") or target_slot

            submitted_comp = submission_map.get(target_slot)
            comp_code = cls.map_placement_to_competency(target_slot, expected_comp)

            # Record total weight for this competency
            competency_tracking[comp_code]["total"] += 1
            competency_tracking[comp_code]["max_score"] += marks_per_item

            if submitted_comp == expected_comp:
                is_correct = True
                correct_count += 1
                status = "CORRECT"
                competency_tracking[comp_code]["correct"] += 1
                competency_tracking[comp_code]["score"] += marks_per_item
            elif not submitted_comp:
                is_correct = False
                status = "MISSING"
            else:
                is_correct = False
                status = "INCORRECT_COMPONENT"

            detailed_breakdown.append({
                "slot_id": target_slot,
                "slot_label": slot_label,
                "expected_component_id": expected_comp,
                "submitted_component_id": submitted_comp,
                "status": status,
                "is_correct": is_correct,
                "competency_code": comp_code
            })

        # Calculate competency percentages
        for code, info in competency_tracking.items():
            if info["total"] > 0:
                info["percentage"] = round((info["correct"] / info["total"]) * 100.0, 2)
            else:
                # If not tested in this question, default to neutral
                info["percentage"] = 0.0

        # 4. Calculate score and marks
        ratio = (correct_count / total_required) if total_required > 0 else 0.0
        score_percentage = round(ratio * 100.0, 2)
        earned_marks = round(max_marks * ratio, 2)
        is_passed = score_percentage >= 60.0

        eval_note = f"Placed {correct_count}/{total_required} required components correctly ({score_percentage}% - {earned_marks}/{max_marks} marks)"

        return {
            "score_percentage": score_percentage,
            "earned_marks": earned_marks,
            "correct_count": correct_count,
            "total_required": total_required,
            "is_passed": is_passed,
            "eval_note": eval_note,
            "breakdown": detailed_breakdown,
            "competency_scores": competency_tracking
        }

hardware_evaluator = HardwareEvaluator()
