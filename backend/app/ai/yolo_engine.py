import base64
import io
import cv2
import numpy as np
from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True
import logging

logger = logging.getLogger("yolo_engine")

_model = None

def get_yolo_model():
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            # Initialize YOLOv8 Nano model (pretrained on COCO dataset)
            logger.info("Initializing YOLOv8 Nano model for AI Proctoring...")
            _model = YOLO("yolov8n.pt")
            logger.info("YOLOv8 Nano model initialized successfully.")
        except Exception as e:
            logger.warning(f"Ultralytics YOLO initialization note/error: {e}")
            _model = False
    return _model if _model is not False else None

# COCO target malpractice class IDs/names
TARGET_CLASSES = {
    0: "person",
    67: "cell phone",
    73: "book",
    63: "laptop",
    76: "scissors"
}

def analyze_webcam_frame(base64_frame: str):
    """
    Analyzes base64 JPEG webcam frame using YOLO model.
    Returns detected objects, bounding boxes, security violations, and annotated snapshot.
    """
    try:
        if "," in base64_frame:
            base64_frame = base64_frame.split(",")[1]
            
        img_bytes = base64.b64decode(base64_frame)
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_np = np.array(pil_img)
        img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        h, w, _ = img_cv.shape

        model = get_yolo_model()
        
        detected_objects = []
        violations = []
        person_count = 0
        phone_detected = False
        book_detected = False

        if model is not None:
            # Run YOLO inference
            results = model(img_cv, verbose=False, conf=0.35)
            if results and len(results) > 0:
                boxes = results[0].boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    cls_name = model.names.get(cls_id, f"class_{cls_id}")
                    
                    xyxy = box.xyxy[0].tolist()
                    x1, y1, x2, y2 = int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])
                    
                    if cls_name == "person":
                        person_count += 1
                    elif cls_name in ["cell phone", "phone", "mobile"]:
                        phone_detected = True
                    elif cls_name in ["book", "paper", "notebook"]:
                        book_detected = True

                    detected_objects.append({
                        "class_name": cls_name,
                        "confidence": round(conf * 100, 1),
                        "bbox": [x1, y1, x2, y2]
                    })

                    # Draw bounding box on output snapshot frame
                    is_danger = cls_name in ["cell phone", "book", "laptop"] or (cls_name == "person" and person_count > 1)
                    color = (0, 0, 255) if is_danger else (0, 255, 0)
                    cv2.rectangle(img_cv, (x1, y1), (x2, y2), color, 2)
                    label_str = f"{cls_name.upper()} {round(conf * 100)}%"
                    cv2.putText(img_cv, label_str, (x1, max(y1 - 8, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        else:
            # Fallback Computer Vision Haar-cascade detection if PyTorch/YOLO loading
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            person_count = len(faces)
            
            for (x, y, fw, fh) in faces:
                detected_objects.append({
                    "class_name": "person",
                    "confidence": 90.0,
                    "bbox": [int(x), int(y), int(x + fw), int(y + fh)]
                })
                cv2.rectangle(img_cv, (x, y), (x + fw, y + fh), (0, 255, 0), 2)
                cv2.putText(img_cv, "FACE DETECTED 90%", (x, max(y - 8, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Security Violation Rule Evaluations
        if phone_detected:
            violations.append({
                "type": "PHONE_DETECTED",
                "details": "AI Detector: Mobile phone detected in camera viewport."
            })

        if person_count > 1:
            violations.append({
                "type": "MULTIPLE_PERSONS_DETECTED",
                "details": f"AI Detector: {person_count} persons detected in examination view."
            })
        elif person_count == 0:
            violations.append({
                "type": "NO_STUDENT_DETECTED",
                "details": "AI Detector: No student face/body detected in frame."
            })

        if book_detected:
            violations.append({
                "type": "UNAUTHORIZED_MATERIAL_DETECTED",
                "details": "AI Detector: Unauthorized paper/book material detected."
            })

        # Encode annotated frame to Base64 JPEG data URL
        _, buffer = cv2.imencode(".jpg", img_cv)
        annotated_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

        return {
            "success": True,
            "person_count": person_count,
            "detected_objects": detected_objects,
            "violations": violations,
            "annotated_snapshot": annotated_b64
        }

    except Exception as e:
        logger.error(f"Error in YOLO frame analysis: {e}")
        return {
            "success": False,
            "error": str(e),
            "person_count": 0,
            "detected_objects": [],
            "violations": [],
            "annotated_snapshot": None
        }
