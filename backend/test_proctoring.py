import sys
import os
import base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.models import User, StudentProfile, Assessment, AssessmentAttempt

client = TestClient(app)

def test_malpractice_proctoring_workflow():
    db = SessionLocal()
    # Find test student user
    student_user = db.query(User).join(StudentProfile).first()
    assert student_user is not None, "Student user should exist"
    
    # Obtain token or mock auth header
    from app.auth.jwt import create_access_token
    token = create_access_token(data={"sub": student_user.username})
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Fetch available assessments
    res = client.get("/api/v1/assessments", headers=headers)
    assert res.status_code == 200
    assessments = res.json()
    assert len(assessments) > 0, "Assessments should be present"
    assessment_id = assessments[0]["id"]
    
    # 2. Start Assessment Attempt
    start_res = client.post(f"/api/v1/assessments/{assessment_id}/start", headers=headers)
    assert start_res.status_code == 200
    attempt_data = start_res.json()
    attempt_id = attempt_data["attempt_id"]
    assert attempt_data["tab_switch_count"] == 0
    assert attempt_data["malpractice_flagged"] is False
    assert len(attempt_data["questions"]) > 0
    
    # 3. Log 1st Violation (Tab Switch)
    v1_res = client.post("/api/v1/assessments/log-violation", json={
        "attempt_id": attempt_id,
        "violation_type": "TAB_SWITCH",
        "details": "Student switched tabs to external search engine."
    }, headers=headers)
    assert v1_res.status_code == 200
    assert v1_res.json()["tab_switch_count"] == 1
    assert v1_res.json()["malpractice_flagged"] is False
    
    import cv2, numpy as np
    dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, img_buf = cv2.imencode(".jpg", dummy_img)
    valid_b64 = "data:image/jpeg;base64," + base64.b64encode(img_buf).decode("utf-8")

    # 4. Log 2nd Violation (Video Proctoring: PHONE_DETECTED with webcam snapshot)
    v2_res = client.post("/api/v1/assessments/log-violation", json={
        "attempt_id": attempt_id,
        "violation_type": "PHONE_DETECTED",
        "details": "AI Video Proctoring: Mobile phone detected in camera viewport.",
        "snapshot_data": valid_b64
    }, headers=headers)
    assert v2_res.status_code == 200
    assert v2_res.json()["tab_switch_count"] == 2

    # 4b. Test Proctoring Frame Analysis Endpoint
    ai_frame_res = client.post("/api/v1/assessments/ai-analyze-frame", json={
        "attempt_id": attempt_id,
        "frame_data": valid_b64
    }, headers=headers)
    assert ai_frame_res.status_code == 200
    assert ai_frame_res.json()["success"] is True
    
    # 5. Log 3rd Violation (Tab Switch - Triggers 3rd Limit & Malpractice Flag)
    v3_res = client.post("/api/v1/assessments/log-violation", json={
        "attempt_id": attempt_id,
        "violation_type": "TAB_SWITCH",
        "details": "Student switched tabs (3rd overall proctoring violation)."
    }, headers=headers)
    assert v3_res.status_code == 200
    assert v3_res.json()["tab_switch_count"] == 3
    assert v3_res.json()["malpractice_flagged"] is True
    
    # 7. Submit Assessment Attempt
    first_q = attempt_data["questions"][0]
    selected_opt = first_q["options"][0]["id"] if first_q["options"] else None
    
    sub_res = client.post("/api/v1/assessments/submit", json={
        "attempt_id": attempt_id,
        "answers": [
            {
                "question_id": first_q["question_id"],
                "selected_option_id": selected_opt,
                "descriptive_text": None,
                "is_marked_for_review": False
            }
        ]
    }, headers=headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["malpractice_flagged"] is True
    
    # 8. Check Faculty Evaluation Endpoint
    pending_res = client.get("/api/v1/evaluation/pending")
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    flagged_attempt = next((att for att in pending_list if att["attempt_id"] == attempt_id), None)
    assert flagged_attempt is not None
    assert flagged_attempt["malpractice_flagged"] is True
    assert flagged_attempt["tab_switch_count"] == 3
    
    # 9. Load Detailed Attempt Audit Logs for Faculty
    eval_att_res = client.get(f"/api/v1/evaluation/attempt/{attempt_id}")
    assert eval_att_res.status_code == 200
    eval_data = eval_att_res.json()
    assert eval_data["malpractice_flagged"] is True
    assert len(eval_data["violation_logs"]) >= 3
    assert len(eval_data["webcam_snapshots"]) >= 1
    
    print("\n[OK] ALL PROCTORING & MALPRACTICE SECURITY UNIT TESTS PASSED SUCCESSFULLY!")
    db.close()

if __name__ == "__main__":
    test_malpractice_proctoring_workflow()
