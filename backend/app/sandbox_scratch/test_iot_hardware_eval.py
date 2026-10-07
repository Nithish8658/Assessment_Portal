import os
import sys
import json

# Ensure app path resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.assessment.hardware_evaluator import hardware_evaluator

def run_tests():
    print("Testing Hardware Evaluator...")

    # Rules for Task 08 (Industrial RS-485 Modbus Vibration Analyzer - N_req = 6)
    rules = {
        "evaluation_type": "HARDWARE_SLOT_MATCH",
        "total_required_count": 6,
        "required_placements": [
            {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_STM32F401", "description": "STM32F401 in DSP MCU Socket"},
            {"slot_id": "SLOT_RS485_BUS", "expected_component_id": "COMP_ISO3082", "description": "ISO3082 in RS-485 Port"},
            {"slot_id": "SLOT_I2C_ADC", "expected_component_id": "COMP_ADS1115", "description": "ADS1115 in 16-Bit Diff ADC Slot"},
            {"slot_id": "SLOT_ANALOG_IN", "expected_component_id": "COMP_PIEZO_AMP", "description": "Piezo in Transducer Header"},
            {"slot_id": "SLOT_SPI_TEMP", "expected_component_id": "COMP_MAX31865", "description": "MAX31865 in RTD PT100 Header"},
            {"slot_id": "SLOT_IND_POWER", "expected_component_id": "COMP_LM2596_BUCK", "description": "LM2596 in 24V Buck Port"}
        ]
    }

    # Case 1: 100% Perfect Attempt
    perfect_submission = [
        {"slot_id": "SLOT_MCU", "component_id": "COMP_STM32F401"},
        {"slot_id": "SLOT_RS485_BUS", "component_id": "COMP_ISO3082"},
        {"slot_id": "SLOT_I2C_ADC", "component_id": "COMP_ADS1115"},
        {"slot_id": "SLOT_ANALOG_IN", "component_id": "COMP_PIEZO_AMP"},
        {"slot_id": "SLOT_SPI_TEMP", "component_id": "COMP_MAX31865"},
        {"slot_id": "SLOT_IND_POWER", "component_id": "COMP_LM2596_BUCK"}
    ]
    res1 = hardware_evaluator.evaluate_placement(rules, perfect_submission, max_marks=4.0)
    print("\nCase 1 (100% Perfect):")
    print(f"  Score: {res1['score_percentage']}% | Earned: {res1['earned_marks']}/4.0 | Passed: {res1['is_passed']}")
    assert res1['score_percentage'] == 100.0
    assert res1['earned_marks'] == 4.0
    assert res1['correct_count'] == 6

    # Case 2: Partial (3 out of 6 correct = 50%)
    partial_submission = [
        {"slot_id": "SLOT_MCU", "component_id": "COMP_STM32F401"},
        {"slot_id": "SLOT_RS485_BUS", "component_id": "COMP_MAX485_RAW"}, # Distractor
        {"slot_id": "SLOT_I2C_ADC", "component_id": "COMP_ADS1115"},
        {"slot_id": "SLOT_ANALOG_IN", "component_id": "COMP_PIEZO_AMP"},
        {"slot_id": "SLOT_SPI_TEMP", "component_id": "COMP_NTC_10K"}, # Distractor
        # SLOT_IND_POWER is empty / missing
    ]
    res2 = hardware_evaluator.evaluate_placement(rules, partial_submission, max_marks=4.0)
    print("\nCase 2 (Partial 3/6):")
    print(f"  Score: {res2['score_percentage']}% | Earned: {res2['earned_marks']}/4.0 | Passed: {res2['is_passed']}")
    assert res2['score_percentage'] == 50.0
    assert res2['earned_marks'] == 2.0
    assert res2['correct_count'] == 3

    # Case 3: Empty Submission
    res3 = hardware_evaluator.evaluate_placement(rules, [], max_marks=4.0)
    print("\nCase 3 (Empty):")
    print(f"  Score: {res3['score_percentage']}% | Earned: {res3['earned_marks']}/4.0 | Passed: {res3['is_passed']}")
    assert res3['score_percentage'] == 0.0
    assert res3['earned_marks'] == 0.0
    assert res3['correct_count'] == 0

    print("\nALL HARDWARE EVALUATOR TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
