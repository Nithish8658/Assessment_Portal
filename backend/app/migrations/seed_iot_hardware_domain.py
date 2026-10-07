import os
import sys
import json
import datetime
from sqlalchemy.orm import Session

# Ensure app path resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import engine, Base, SessionLocal
from app.models.models import User, StudentProfile, AcademicClass
from app.models.assessment_models import (
    AssessmentDomain,
    AssessmentRound,
    AssessmentPolicy,
    Competency,
    AssessmentQuestion,
    QuestionEvaluationConfig,
    QuestionVersion
)

def seed_iot_hardware_domain():
    print("=" * 80)
    print("SEEDING DEDICATED DOMAIN 5: IOT HARDWARE ENGINEERING MASTER TRACK")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed / Upsert Competencies
        print("\n[STEP 1] Seeding Competencies...")
        competencies_data = [
            ("IOT_MCU_ARCH", "Microcontroller & Compute Architecture Selection", "Hardware Architecture", "Evaluating computational headroom, memory, hardware DSP/FFT, DMA, and ultra-low-power sleep modes."),
            ("IOT_BUS_PROTOCOLS", "Serial, Differential & Industrial Bus Interfacing", "Buses & Communications", "Mastery of I2C, SPI, UART, RS-485 Modbus, CAN-Bus 2.0B, DALI, and SDI-12 protocol physical layers."),
            ("IOT_SENSOR_AFE", "Sensor Front-End, Transducers & Signal Conditioning", "Sensing & AFE", "Interfacing analog sensors, 4-20mA current loops, high-resolution Delta-Sigma ADCs, and RTD Kelvin bridges."),
            ("IOT_POWER_ISOLATION", "Power Domain Management & Galvanic Isolation", "Power & Electrical Safety", "Switching buck/boost regulators, MPPT solar controllers, battery BMS, optoisolators, and surge suppression."),
            ("IOT_ACTUATOR_DRIVE", "Actuator Interfacing, Power Switching & Suppression", "Actuation & Control", "Solid State Relays, Triac AC phase dimmers, high-power MOSFETs, and inductive flyback protection.")
        ]

        comp_map = {}
        for code, name, category, desc in competencies_data:
            c = db.query(Competency).filter(Competency.code == code).first()
            if not c:
                c = Competency(code=code, name=name, category=category, description=desc)
                db.add(c)
                db.flush()
                print(f"  + Created Competency: {code} ({name})")
            else:
                c.name = name
                c.category = category
                c.description = desc
                db.flush()
            comp_map[code] = c.id

        # 2. Seed / Upsert Domain
        print("\n[STEP 2] Seeding Assessment Domain...")
        domain_slug = "iot-hardware-systems"
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == domain_slug).first()
        if not domain:
            domain = AssessmentDomain(
                slug=domain_slug,
                title="IoT Hardware Engineering Master Track",
                description="Advanced hardware engineering benchmark testing component selection, bus protocol matching, electrical constraints, and motherboard assembly across IoT domains.",
                is_active=True
            )
            db.add(domain)
            db.flush()
            print(f"  + Created Assessment Domain: {domain.title} (slug: {domain.slug})")
        else:
            domain.title = "IoT Hardware Engineering Master Track"
            domain.description = "Advanced hardware engineering benchmark testing component selection, bus protocol matching, electrical constraints, and motherboard assembly across IoT domains."
            domain.is_active = True
            db.flush()
            print(f"  * Updated Assessment Domain: {domain.title}")

        # 3. Seed Round 1 & Policy
        print("\n[STEP 3] Seeding Round 1 and Assessment Policy...")
        round_slug = "round-1-component-selection-placement"
        round_obj = db.query(AssessmentRound).filter(
            AssessmentRound.domain_id == domain.id,
            AssessmentRound.slug == round_slug
        ).first()

        if not round_obj:
            round_obj = AssessmentRound(
                domain_id=domain.id,
                round_number=1,
                slug=round_slug,
                title="Round 1: Component Selection and Placement",
                description="Interactive CAD/PCB motherboard workstation. Students select required hardware modules from the palette and place them into electrically compatible slots based on engineering specifications.",
                round_type="HARDWARE_SELECTION_PLACEMENT",
                duration_minutes=20,
                questions_per_attempt=2,
                rules_json={"allow_repositioning": True, "show_pinout_hints": True}
            )
            db.add(round_obj)
            db.flush()
            print(f"  + Created Assessment Round: {round_obj.title}")
        else:
            round_obj.title = "Round 1: Component Selection and Placement"
            round_obj.description = "Interactive CAD/PCB motherboard workstation. Students select required hardware modules from the palette and place them into electrically compatible slots based on engineering specifications."
            round_obj.round_type = "HARDWARE_SELECTION_PLACEMENT"
            round_obj.duration_minutes = 20
            round_obj.questions_per_attempt = 2
            db.flush()
            print(f"  * Updated Assessment Round: {round_obj.title}")

        # Seed Policy
        policy = db.query(AssessmentPolicy).filter(AssessmentPolicy.round_id == round_obj.id).first()
        if not policy:
            policy = AssessmentPolicy(
                round_id=round_obj.id,
                passing_score=60.0,
                weightage_percent=100.0,
                min_score_percent=50.0,
                mandatory_pass=True
            )
            db.add(policy)
            db.flush()
            print(f"  + Created Assessment Policy for Round 1")
        else:
            policy.passing_score = 60.0
            policy.weightage_percent = 100.0
            policy.mandatory_pass = True
            db.flush()

        # 4. Seed All 10 Curated Tasks
        print("\n[STEP 4] Seeding 10 IoT Hardware Tasks (Easy, Medium, Hard)...")

        tasks_dataset = [
            # -------------------------------------------------------------
            # TIER 1: EASY (N_req = 3, Marks = 1.0, Time = 90s)
            # -------------------------------------------------------------
            {
                "title": "Task 01: Smart Indoor Thermostat & Ambient Display Node",
                "difficulty": "Easy",
                "marks": 1.0,
                "time_limit_seconds": 90,
                "competency_code": "IOT_SENSOR_AFE",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Design a compact residential indoor air monitoring node. The device must measure ambient room temperature "
                    "and relative humidity, display real-time sensor metrics on a local low-power display screen, and transmit telemetry "
                    "over Wi-Fi to a cloud MQTT dashboard.\n\n"
                    "### Technical Specifications\n"
                    "- **Processing Core**: Wi-Fi enabled microcontroller with 3.3V GPIO.\n"
                    "- **Sensor Interface**: Single-bus digital humidity/temperature sensor.\n"
                    "- **Display Interface**: 0.96-inch monochrome display communicating over standard 2-wire I2C bus.\n"
                    "- **Power**: Standard 5V USB regulated supply.\n\n"
                    "### Instructions\n"
                    "Select the 3 required hardware components from your inventory and place them into their corresponding motherboard slots."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-01",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-INDOOR-V1",
                        "board_name": "Smart Thermostat Dev PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket (3.3V)", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, GPIO, I2C, SPI"},
                            {"slot_id": "SLOT_DIGITAL_GPIO", "label": "Digital Sensor Port", "supported_types": ["DIGITAL_SENSOR"], "pin_bus": "3.3V, GND, GPIO4 (Single-Wire)"},
                            {"slot_id": "SLOT_I2C_DISPLAY", "label": "I2C Display Port", "supported_types": ["DISPLAY"], "pin_bus": "3.3V, GND, SCL (GPIO22), SDA (GPIO21)"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_ESP32_WROOM", "name": "ESP32-WROOM-32 Module", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp32.png", "specifications": "Dual Core 240MHz, 2.4GHz Wi-Fi + BLE, 3.3V logic"},
                        {"component_id": "COMP_DHT22", "name": "DHT22 Digital Temperature & Humidity Sensor", "category": "DIGITAL_SENSOR", "image_url": "/assets/components/dht22.png", "specifications": "Single-bus digital protocol, -40 to 80°C, 0-100% RH"},
                        {"component_id": "COMP_OLED_096_I2C", "name": "0.96\" I2C OLED Display (SSD1306)", "category": "DISPLAY", "image_url": "/assets/components/oled.png", "specifications": "128x64 pixels, 4-Pin I2C interface (Addr: 0x3C)"},
                        {"component_id": "COMP_HCSR04", "name": "HC-SR04 Ultrasonic Distance Sensor", "category": "DIGITAL_SENSOR", "image_url": "/assets/components/sonar.png", "specifications": "Sonar distance measurement, 5V TTL (Distractor)"},
                        {"component_id": "COMP_MAX485", "name": "MAX485 Industrial Transceiver", "category": "COMMUNICATION", "image_url": "/assets/components/rs485.png", "specifications": "RS-485 differential bus transceiver (Distractor)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 3,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_ESP32_WROOM", "description": "ESP32 placed in MCU Socket"},
                        {"slot_id": "SLOT_DIGITAL_GPIO", "expected_component_id": "COMP_DHT22", "description": "DHT22 placed in Digital Sensor Port"},
                        {"slot_id": "SLOT_I2C_DISPLAY", "expected_component_id": "COMP_OLED_096_I2C", "description": "0.96\" I2C OLED placed in Display Port"}
                    ]
                }
            },
            {
                "title": "Task 02: Automated Water Tank Level & Pump Trigger",
                "difficulty": "Easy",
                "marks": 1.0,
                "time_limit_seconds": 90,
                "competency_code": "IOT_ACTUATOR_DRIVE",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Build an automated liquid management system for an industrial overhead water reservoir. The unit must non-intrusively "
                    "measure water surface level via acoustic time-of-flight pulses and switch on an AC submersible pump when liquid level drops below threshold.\n\n"
                    "### Technical Specifications\n"
                    "- **Controller**: 8-bit ATmega embedded processing unit.\n"
                    "- **Level Sensor**: Non-contact ultrasonic transceiver operating with standard Trigger/Echo timing pulses.\n"
                    "- **Actuator**: Optocoupler-isolated 5V single-channel relay rated for 250VAC motor control."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-02",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-TANK-V1",
                        "board_name": "Liquid Management Carrier Board",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket (5V)", "supported_types": ["MICROCONTROLLER"], "pin_bus": "5V, GND, Digital I/O, Analog In"},
                            {"slot_id": "SLOT_SONAR_PORT", "label": "Sonar Transceiver Port", "supported_types": ["DIGITAL_SENSOR"], "pin_bus": "5V, GND, TRIG (D9), ECHO (D10)"},
                            {"slot_id": "SLOT_RELAY_OUTPUT", "label": "Pump Relay Header", "supported_types": ["ACTUATOR_RELAY"], "pin_bus": "5V, GND, IN (D4)"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_ARDUINO_NANO", "name": "Arduino Nano (ATmega328P)", "category": "MICROCONTROLLER", "image_url": "/assets/components/nano.png", "specifications": "16MHz AVR 8-bit MCU, 5V logic"},
                        {"component_id": "COMP_HCSR04", "name": "HC-SR04 Ultrasonic Sensor", "category": "DIGITAL_SENSOR", "image_url": "/assets/components/sonar.png", "specifications": "2cm to 400cm range, 5V sonar pulses"},
                        {"component_id": "COMP_5V_RELAY", "name": "5V 1-Channel Optoisolated Relay Module", "category": "ACTUATOR_RELAY", "image_url": "/assets/components/relay.png", "specifications": "10A 250VAC switching capacity"},
                        {"component_id": "COMP_PIR_MOTION", "name": "HC-SR501 PIR Motion Sensor", "category": "DIGITAL_SENSOR", "image_url": "/assets/components/pir.png", "specifications": "Passive IR body heat detector (Distractor)"},
                        {"component_id": "COMP_SPI_DISPLAY", "name": "1.8\" TFT SPI Display (ST7735)", "category": "DISPLAY", "image_url": "/assets/components/tft.png", "specifications": "Color SPI screen (Distractor)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 3,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_ARDUINO_NANO", "description": "Arduino Nano placed in MCU Socket"},
                        {"slot_id": "SLOT_SONAR_PORT", "expected_component_id": "COMP_HCSR04", "description": "HC-SR04 placed in Sonar Port"},
                        {"slot_id": "SLOT_RELAY_OUTPUT", "expected_component_id": "COMP_5V_RELAY", "description": "5V Relay placed in Pump Relay Header"}
                    ]
                }
            },
            {
                "title": "Task 03: Basic Greenhouse Drip Irrigation Unit",
                "difficulty": "Easy",
                "marks": 1.0,
                "time_limit_seconds": 90,
                "competency_code": "IOT_MCU_ARCH",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Assemble a micro-irrigation controller for a smart greenhouse. The system samples soil volumetric moisture via an analog "
                    "probe and controls a 12V DC solenoid irrigation valve through an optoisolated driver.\n\n"
                    "### Technical Specifications\n"
                    "- **Compute**: Wi-Fi SoC with onboard 10-bit ADC channel.\n"
                    "- **Moisture Sensor**: Corrosion-resistant capacitive soil sensor with analog output.\n"
                    "- **Solenoid Actuation**: 5V relay module with optocoupler isolation."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-03",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-AGRI-BASIC-V1",
                        "board_name": "Greenhouse Drip Carrier PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V/5V, GND, ADC0, GPIO"},
                            {"slot_id": "SLOT_ANALOG_A0", "label": "Analog Moisture Port (ADC0)", "supported_types": ["ANALOG_SENSOR"], "pin_bus": "3.3V, GND, ADC0 (0-3.3V)"},
                            {"slot_id": "SLOT_VALVE_RELAY", "label": "Valve Relay Output", "supported_types": ["ACTUATOR_RELAY"], "pin_bus": "5V, GND, GPIO14"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_ESP8266_NODEMCU", "name": "NodeMCU ESP8266 Module", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp8266.png", "specifications": "80MHz Wi-Fi SoC with single ADC0 pin"},
                        {"component_id": "COMP_CAP_SOIL_V12", "name": "Capacitive Soil Moisture Sensor v1.2", "category": "ANALOG_SENSOR", "image_url": "/assets/components/soil_sensor.png", "specifications": "1.2V-3.0V analog output, corrosion proof"},
                        {"component_id": "COMP_OPTO_RELAY", "name": "Optocoupled 5V Relay Shield", "category": "ACTUATOR_RELAY", "image_url": "/assets/components/relay.png", "specifications": "Optically isolated 10A trigger"},
                        {"component_id": "COMP_MQ2_GAS", "name": "MQ-2 Flammable Gas Sensor", "category": "ANALOG_SENSOR", "image_url": "/assets/components/mq2.png", "specifications": "LPG/Smoke sensor with heater (Distractor)"},
                        {"component_id": "COMP_RC522_RFID", "name": "RC522 13.56MHz RFID Reader", "category": "COMMUNICATION", "image_url": "/assets/components/rfid.png", "specifications": "SPI NFC badge reader (Distractor)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 3,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_ESP8266_NODEMCU", "description": "NodeMCU placed in MCU Socket"},
                        {"slot_id": "SLOT_ANALOG_A0", "expected_component_id": "COMP_CAP_SOIL_V12", "description": "Soil sensor placed in Analog Port"},
                        {"slot_id": "SLOT_VALVE_RELAY", "expected_component_id": "COMP_OPTO_RELAY", "description": "Relay placed in Valve Relay Output"}
                    ]
                }
            },

            # -------------------------------------------------------------
            # TIER 2: MEDIUM (N_req = 4-5, Marks = 2.0, Time = 180s)
            # -------------------------------------------------------------
            {
                "title": "Task 04: Solar-Powered LoRaWAN Air Quality Profiler",
                "difficulty": "Medium",
                "marks": 2.0,
                "time_limit_seconds": 180,
                "competency_code": "IOT_BUS_PROTOCOLS",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Engineer an autonomous municipal air quality telemetry station for smart light poles. The station must monitor fine "
                    "particulate matter (PM2.5/PM10) via laser scattering, profile VOC gas concentrations over I2C, transmit over long-range "
                    "sub-GHz LoRaWAN (868MHz), and harvest power through an MPPT solar charger.\n\n"
                    "### Technical Specifications\n"
                    "- **Master Controller**: High-performance dual-core 3.3V SoC with hardware UART, I2C, and SPI peripherals.\n"
                    "- **Particulate Sensor**: Optical laser dust sensor streaming active frame packets over 9600-baud UART.\n"
                    "- **Gas & Environmental**: 4-in-1 MOX gas, barometric pressure, humidity, and temperature sensor on I2C bus.\n"
                    "- **RF Modem**: Semtech SX1262 LoRa transceiver communicating over high-speed SPI bus.\n"
                    "- **Power Management**: Maximum Power Point Tracking (MPPT) lithium solar shield."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-04",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-SOLAR-LORA-V2",
                        "board_name": "Off-Grid Environmental Telemetry PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket (3.3V)", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, UART, I2C, SPI"},
                            {"slot_id": "SLOT_UART_HEADER", "label": "UART Laser Sensor Header", "supported_types": ["DIGITAL_SENSOR"], "pin_bus": "5V/3.3V, GND, RX (GPIO16), TX (GPIO17)"},
                            {"slot_id": "SLOT_I2C_SENSOR", "label": "I2C Environmental Bus", "supported_types": ["I2C_SENSOR"], "pin_bus": "3.3V, GND, SCL (GPIO22), SDA (GPIO21)"},
                            {"slot_id": "SLOT_SPI_RF", "label": "SPI Sub-GHz RF Header", "supported_types": ["COMMUNICATION"], "pin_bus": "3.3V, GND, MOSI, MISO, SCK, CS (GPIO5), DIO1"},
                            {"slot_id": "SLOT_MPPT_PWR", "label": "Solar Energy Port", "supported_types": ["POWER_MODULE"], "pin_bus": "SOLAR_IN, BAT_IN, 3V3_REG, GND"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_ESP32_S3", "name": "ESP32-S3 Dual-Core SoC", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp32s3.png", "specifications": "Xtensa LX7 240MHz, Vector instructions, 3.3V"},
                        {"component_id": "COMP_PMS5003", "name": "Plantower PMS5003 Laser Dust Sensor", "category": "DIGITAL_SENSOR", "image_url": "/assets/components/pms5003.png", "specifications": "PM1.0/PM2.5/PM10 laser scattering, UART output"},
                        {"component_id": "COMP_BME680", "name": "Bosch BME680 Environmental VOC Sensor", "category": "I2C_SENSOR", "image_url": "/assets/components/bme680.png", "specifications": "Gas, Temp, Humidity, Pressure on I2C (0x77)"},
                        {"component_id": "COMP_SX1262_LORA", "name": "Semtech SX1262 LoRaWAN SPI Module (868MHz)", "category": "COMMUNICATION", "image_url": "/assets/components/lora.png", "specifications": "+22dBm output, sub-GHz LoRaWAN protocol"},
                        {"component_id": "COMP_CN3791_MPPT", "name": "CN3791 MPPT Solar Lithium Charger Shield", "category": "POWER_MODULE", "image_url": "/assets/components/mppt.png", "specifications": "Solar panel MPPT tracking, LiFePO4 charging"},
                        {"component_id": "COMP_MQ135", "name": "MQ-135 Air Quality Sensor", "category": "ANALOG_SENSOR", "image_url": "/assets/components/mq135.png", "specifications": "150mA heating filament (Distractor - drains battery)"},
                        {"component_id": "COMP_HC05_BT", "name": "HC-05 Bluetooth Module", "category": "COMMUNICATION", "image_url": "/assets/components/hc05.png", "specifications": "Short-range 2.4GHz Bluetooth (Distractor)"},
                        {"component_id": "COMP_USB_WALL", "name": "5V 2A Linear Wall Adapter", "category": "POWER_MODULE", "image_url": "/assets/components/adapter.png", "specifications": "Mains supply brick (Distractor - off-grid invalid)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 5,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_ESP32_S3", "description": "ESP32-S3 placed in MCU Socket"},
                        {"slot_id": "SLOT_UART_HEADER", "expected_component_id": "COMP_PMS5003", "description": "PMS5003 placed in UART Header"},
                        {"slot_id": "SLOT_I2C_SENSOR", "expected_component_id": "COMP_BME680", "description": "BME680 placed in I2C Environmental Bus"},
                        {"slot_id": "SLOT_SPI_RF", "expected_component_id": "COMP_SX1262_LORA", "description": "SX1262 placed in SPI RF Header"},
                        {"slot_id": "SLOT_MPPT_PWR", "expected_component_id": "COMP_CN3791_MPPT", "description": "CN3791 MPPT placed in Solar Energy Port"}
                    ]
                }
            },
            {
                "title": "Task 05: Precision Agritech SDI-12 Soil Salinity & Weather Node",
                "difficulty": "Medium",
                "marks": 2.0,
                "time_limit_seconds": 180,
                "competency_code": "IOT_BUS_PROTOCOLS",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Assemble an agricultural field gateway capable of interfacing with underground SDI-12 multi-depth soil probes, "
                    "measuring solar radiation via a 4–20mA current-loop pyranometer, and generating a 12V probe excitation rail.\n\n"
                    "### Technical Specifications\n"
                    "- **Controller**: 32-bit Wi-Fi/BLE MCU.\n"
                    "- **Subterranean Bus**: SDI-12 bi-directional half-duplex transceiver translating 1200-baud protocol.\n"
                    "- **Radiation Sensor Front-End**: Precision 4–20mA to 0–3.3V current loop receiver with 0.1% burden resistor.\n"
                    "- **Voltage Boost**: High-efficiency DC-DC step-up boost converter providing 12V DC excitation."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-05",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-SDI12-AGRI-V1",
                        "board_name": "SDI-12 Industrial Agritech PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, GPIO, ADC, UART"},
                            {"slot_id": "SLOT_SDI12_BUS", "label": "SDI-12 Fieldbus Header", "supported_types": ["COMMUNICATION"], "pin_bus": "12V, GND, SDI12_DATA (Bi-dir)"},
                            {"slot_id": "SLOT_CURRENT_LOOP", "label": "4-20mA Current Receiver Port", "supported_types": ["ANALOG_AFE"], "pin_bus": "LOOP+, LOOP-, ADC_OUT (GPIO36)"},
                            {"slot_id": "SLOT_BOOST_PWR", "label": "12V Boost Regulator Port", "supported_types": ["POWER_MODULE"], "pin_bus": "VIN (3.7-5V), 12V_OUT, GND"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_ESP32_WROOM", "name": "ESP32-WROOM-32D Module", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp32.png", "specifications": "Dual-Core 240MHz SoC with precise ADC"},
                        {"component_id": "COMP_SDI12_TRANSCEIVER", "name": "SDI-12 Bi-directional Logic Transceiver", "category": "COMMUNICATION", "image_url": "/assets/components/sdi12.png", "specifications": "1200 baud, 3-wire half duplex SDI-12 protocol"},
                        {"component_id": "COMP_4_20MA_RECEIVER", "name": "4-20mA to 0-3.3V Precision Receiver", "category": "ANALOG_AFE", "image_url": "/assets/components/current_loop.png", "specifications": "0.1% 250 ohm precision burden resistor + rail-to-rail op-amp"},
                        {"component_id": "COMP_XL6009_BOOST", "name": "XL6009 DC-DC Step-Up Boost Regulator", "category": "POWER_MODULE", "image_url": "/assets/components/boost.png", "specifications": "Boosts 3.7V/5V battery input to regulated 12V probe rail"},
                        {"component_id": "COMP_DIRECT_ANALOG_JACK", "name": "Direct Analog Wire Terminal (Distractor)", "category": "ANALOG_AFE", "image_url": "/assets/components/terminal.png", "specifications": "Direct ADC connection (Cannot decode 4-20mA loop)"},
                        {"component_id": "COMP_DHT11", "name": "DHT11 Sensor (Distractor)", "category": "DIGITAL_SENSOR", "image_url": "/assets/components/dht11.png", "specifications": "Low-accuracy consumer sensor"},
                        {"component_id": "COMP_LM7805", "name": "LM7805 Step-Down Linear (Distractor)", "category": "POWER_MODULE", "image_url": "/assets/components/7805.png", "specifications": "Step-down linear regulator (Cannot boost)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 4,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_ESP32_WROOM", "description": "ESP32 placed in MCU Socket"},
                        {"slot_id": "SLOT_SDI12_BUS", "expected_component_id": "COMP_SDI12_TRANSCEIVER", "description": "SDI-12 Transceiver placed in Fieldbus Header"},
                        {"slot_id": "SLOT_CURRENT_LOOP", "expected_component_id": "COMP_4_20MA_RECEIVER", "description": "4-20mA Receiver placed in Current Receiver Port"},
                        {"slot_id": "SLOT_BOOST_PWR", "expected_component_id": "COMP_XL6009_BOOST", "description": "XL6009 Boost placed in Boost Regulator Port"}
                    ]
                }
            },
            {
                "title": "Task 06: Wearable IoMT Multi-Wavelength PPG & Fall Telemetry",
                "difficulty": "Medium",
                "marks": 2.0,
                "time_limit_seconds": 180,
                "competency_code": "IOT_SENSOR_AFE",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Build a wearable health telematics wristband for outpatient monitoring. The device continuously reads blood oxygen saturation (SpO2) "
                    "via multi-wavelength optical PPG, computes posture and fall impact via 9-DOF sensor fusion, and triggers haptic pulses on anomalies.\n\n"
                    "### Technical Specifications\n"
                    "- **Core**: Ultra-low power Bluetooth 5.2 ARM Cortex-M4F SoC.\n"
                    "- **Biometric Sensor**: Multi-LED optical pulse oximeter on I2C bus.\n"
                    "- **Inertial Fusion**: 9-axis absolute orientation IMU with internal Digital Motion Processor (DMP).\n"
                    "- **Haptic Driver**: I2C LRA/ERM haptic driver for vibration feedback.\n"
                    "- **Battery Management**: Miniature 3.7V single-cell LiPo charge controller."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-06",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-IOMT-WEAR-V1",
                        "board_name": "Clinical Wearable Carrier PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket (BLE)", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, I2C0, I2C1, GPIO"},
                            {"slot_id": "SLOT_I2C_PPG", "label": "PPG Sensor Port (I2C0)", "supported_types": ["I2C_SENSOR"], "pin_bus": "1.8V/3.3V, GND, SCL, SDA, INT"},
                            {"slot_id": "SLOT_I2C_IMU", "label": "Motion IMU Port (I2C0)", "supported_types": ["I2C_SENSOR"], "pin_bus": "3.3V, GND, SCL, SDA, INT"},
                            {"slot_id": "SLOT_I2C_HAPTIC", "label": "Haptic Driver Port (I2C1)", "supported_types": ["ACTUATOR_HAPTIC"], "pin_bus": "3.3V, GND, SCL1, SDA1, EN"},
                            {"slot_id": "SLOT_LIPO_BMS", "label": "LiPo BMS Charger Port", "supported_types": ["POWER_MODULE"], "pin_bus": "USB_5V, BAT_IN, VDD_SYS, GND"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_NRF52840", "name": "Nordic nRF52840 BLE 5.2 SoC", "category": "MICROCONTROLLER", "image_url": "/assets/components/nrf52.png", "specifications": "64MHz Cortex-M4F, Bluetooth 5.2, <5uA sleep"},
                        {"component_id": "COMP_MAX30102", "name": "MAX30102 Optical SpO2 & Heart Rate", "category": "I2C_SENSOR", "image_url": "/assets/components/max30102.png", "specifications": "Red & IR LEDs, photodetector, 18-bit ADC, I2C"},
                        {"component_id": "COMP_BNO055", "name": "BNO055 9-Axis Orientation IMU with DMP", "category": "I2C_SENSOR", "image_url": "/assets/components/bno055.png", "specifications": "Accelerometer, Gyro, Magnetometer + Fusion algorithm"},
                        {"component_id": "COMP_DRV2605L", "name": "DRV2605L I2C Haptic Motor Driver", "category": "ACTUATOR_HAPTIC", "image_url": "/assets/components/drv2605.png", "specifications": "Immersion TouchSense effects for ERM/LRA motors"},
                        {"component_id": "COMP_MCP73831", "name": "MCP73831 Miniature LiPo Charge Controller", "category": "POWER_MODULE", "image_url": "/assets/components/mcp73831.png", "specifications": "500mA CC/CV single-cell lithium battery charger"},
                        {"component_id": "COMP_ESP32_CAM", "name": "ESP32-CAM AI Camera (Distractor)", "category": "MICROCONTROLLER", "image_url": "/assets/components/cam.png", "specifications": "High power consumption (>200mA)"},
                        {"component_id": "COMP_PIEZO_BUZZER", "name": "12V Piezo Siren (Distractor)", "category": "ACTUATOR_HAPTIC", "image_url": "/assets/components/buzzer.png", "specifications": "Bulky high-voltage acoustic siren"},
                        {"component_id": "COMP_LM35", "name": "LM35 Precision Analog (Distractor)", "category": "ANALOG_SENSOR", "image_url": "/assets/components/lm35.png", "specifications": "Uncalibrated analog body temperature sensor"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 5,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_NRF52840", "description": "nRF52840 placed in MCU Socket"},
                        {"slot_id": "SLOT_I2C_PPG", "expected_component_id": "COMP_MAX30102", "description": "MAX30102 placed in PPG Sensor Port"},
                        {"slot_id": "SLOT_I2C_IMU", "expected_component_id": "COMP_BNO055", "description": "BNO055 placed in Motion IMU Port"},
                        {"slot_id": "SLOT_I2C_HAPTIC", "expected_component_id": "COMP_DRV2605L", "description": "DRV2605L placed in Haptic Driver Port"},
                        {"slot_id": "SLOT_LIPO_BMS", "expected_component_id": "COMP_MCP73831", "description": "MCP73831 placed in LiPo BMS Port"}
                    ]
                }
            },
            {
                "title": "Task 07: Smart Building DALI Lighting & Triac HVAC Controller",
                "difficulty": "Medium",
                "marks": 2.0,
                "time_limit_seconds": 180,
                "competency_code": "IOT_ACTUATOR_DRIVE",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Implement a commercial building ceiling controller managing addressable architectural lighting via the DALI (Digital Addressable "
                    "Lighting Interface) bus, regulating 3-speed HVAC fan coil units via AC Triac phase dimming, and bridging to the BMS over Ethernet.\n\n"
                    "### Technical Specifications\n"
                    "- **MCU**: Real-time 32-bit ARM Cortex-M4 microcontroller.\n"
                    "- **Lighting Bus**: Opto-isolated DALI transceiver translating 16V Manchester protocol.\n"
                    "- **Fan Control**: Zero-crossing detected AC Triac dimmer module for continuous AC motor modulation.\n"
                    "- **BMS Bridge**: SPI Ethernet controller with hardware TCP/IP stack.\n"
                    "- **Power**: Industrial 230VAC to 5VDC encapsulated converter."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-07",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-BMS-DALI-V1",
                        "board_name": "Commercial Building Automation PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "MCU Socket", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, SPI, UART, Timer PWM, GPIO"},
                            {"slot_id": "SLOT_DALI_BUS", "label": "DALI Fieldbus Header", "supported_types": ["COMMUNICATION"], "pin_bus": "16V_DALI+, 16V_DALI-, TX, RX (Optoisolated)"},
                            {"slot_id": "SLOT_TRIAC_AC", "label": "Zero-Cross AC Triac Port", "supported_types": ["ACTUATOR_AC"], "pin_bus": "SYNC_INT, GATE_TRIG, AC_L, AC_N"},
                            {"slot_id": "SLOT_SPI_NET", "label": "SPI Ethernet Module Slot", "supported_types": ["COMMUNICATION"], "pin_bus": "MOSI, MISO, SCK, CS (PB12), INT"},
                            {"slot_id": "SLOT_PWR_SUPPLY", "label": "Encapsulated AC-DC Port", "supported_types": ["POWER_MODULE"], "pin_bus": "AC_LINE, AC_NEUT, +5V_OUT, GND"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_STM32F407", "name": "STM32F407VET6 ARM Cortex-M4", "category": "MICROCONTROLLER", "image_url": "/assets/components/stm32f4.png", "specifications": "168MHz ARM Cortex-M4, advanced timers, 3x SPI"},
                        {"component_id": "COMP_DALI_OPTO", "name": "Opto-Isolated DALI Bus Transceiver", "category": "COMMUNICATION", "image_url": "/assets/components/dali.png", "specifications": "16V Manchester encoded protocol, 1200 baud"},
                        {"component_id": "COMP_TRIAC_DIMMER", "name": "Zero-Cross AC Triac Phase Dimmer Module", "category": "ACTUATOR_AC", "image_url": "/assets/components/triac.png", "specifications": "Optocoupled zero-cross detector + BTA16 Triac"},
                        {"component_id": "COMP_W5500_ETH", "name": "WIZnet W5500 SPI Ethernet Controller", "category": "COMMUNICATION", "image_url": "/assets/components/w5500.png", "specifications": "Hardwired TCP/IP stack, 10/100 Ethernet RJ45"},
                        {"component_id": "COMP_MEANWELL_ACDC", "name": "Mean Well 230V-to-5V Encapsulated AC-DC", "category": "POWER_MODULE", "image_url": "/assets/components/meanwell.png", "specifications": "4kVAC medical/industrial isolation barrier"},
                        {"component_id": "COMP_PWM_MOSFET", "name": "Standard PWM Power MOSFET (Distractor)", "category": "ACTUATOR_AC", "image_url": "/assets/components/mosfet.png", "specifications": "DC only switching (Blows on 230V AC load)"},
                        {"component_id": "COMP_NRF24_RF", "name": "NRF24L01 2.4GHz RF (Distractor)", "category": "COMMUNICATION", "image_url": "/assets/components/nrf24.png", "specifications": "Wireless module (Prohibited in shielded risers)"},
                        {"component_id": "COMP_1CH_RELAY", "name": "Single Channel Relay (Distractor)", "category": "ACTUATOR_AC", "image_url": "/assets/components/relay.png", "specifications": "On/Off only (Cannot do variable speed fan control)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 5,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_STM32F407", "description": "STM32F407 placed in MCU Socket"},
                        {"slot_id": "SLOT_DALI_BUS", "expected_component_id": "COMP_DALI_OPTO", "description": "DALI Transceiver placed in Fieldbus Header"},
                        {"slot_id": "SLOT_TRIAC_AC", "expected_component_id": "COMP_TRIAC_DIMMER", "description": "Triac Dimmer placed in AC Triac Port"},
                        {"slot_id": "SLOT_SPI_NET", "expected_component_id": "COMP_W5500_ETH", "description": "W5500 Ethernet placed in SPI Ethernet Slot"},
                        {"slot_id": "SLOT_PWR_SUPPLY", "expected_component_id": "COMP_MEANWELL_ACDC", "description": "Mean Well AC-DC placed in Power Supply Port"}
                    ]
                }
            },

            # -------------------------------------------------------------
            # TIER 3: HARD (N_req = 6-7, Marks = 4.0, Time = 300s)
            # -------------------------------------------------------------
            {
                "title": "Task 08: Industrial IIoT RS-485 Modbus Predictive Vibration Analyzer",
                "difficulty": "Hard",
                "marks": 4.0,
                "time_limit_seconds": 300,
                "competency_code": "IOT_BUS_PROTOCOLS",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Engineer an industrial edge vibration analyzer for high-speed induction motor bearings. The node must sample 3-axis "
                    "high-frequency piezoelectric acceleration via an external 16-bit differential Delta-Sigma ADC, read stator winding temperature "
                    "over an RTD PT100 Kelvin bridge, stream Modbus RTU telemetry over a galvanically isolated RS-485 line, and operate off dirty 24VDC factory power.\n\n"
                    "### Technical Specifications\n"
                    "- **Core**: 32-bit ARM Cortex-M4 with hardware FPU and DSP instructions for on-chip FFT analysis.\n"
                    "- **Fieldbus**: Galvanically isolated differential RS-485 transceiver (ISO3082) with fail-safe biasing.\n"
                    "- **Vibration AFE**: 16-bit Delta-Sigma ADC with programmable gain amplifier (PGA).\n"
                    "- **Transducer**: Piezoelectric charge-mode accelerometer with integrated charge amplifier.\n"
                    "- **Thermal Interface**: Precision SPI RTD temperature signal converter (MAX31865) for 4-wire PT100 probe.\n"
                    "- **Power Supply**: Wide-input industrial step-down switching buck regulator (24VDC to 3.3VDC)."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-08",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-IIOT-MODBUS-V3",
                        "board_name": "Industrial Modbus Vibration Carrier PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "DSP MCU Socket", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, SPI, I2C, USART_MODBUS, DMA"},
                            {"slot_id": "SLOT_RS485_BUS", "label": "RS-485 Differential Port", "supported_types": ["COMMUNICATION"], "pin_bus": "A, B, GND_ISO, TX, RX, DE_RE"},
                            {"slot_id": "SLOT_I2C_ADC", "label": "16-Bit Diff ADC Slot", "supported_types": ["ANALOG_AFE"], "pin_bus": "3.3V, GND, SCL, SDA, ALERT/RDY, AIN0, AIN1"},
                            {"slot_id": "SLOT_ANALOG_IN", "label": "Piezo Transducer Header", "supported_types": ["PIEZO_SENSOR"], "pin_bus": "EXC+, SIG+, SIG-, SHIELD"},
                            {"slot_id": "SLOT_SPI_TEMP", "label": "RTD PT100 SPI Header", "supported_types": ["SPI_SENSOR"], "pin_bus": "MOSI, MISO, SCK, CS (PA4), RTD+, RTD-"},
                            {"slot_id": "SLOT_IND_POWER", "label": "24V Industrial Buck Port", "supported_types": ["POWER_MODULE"], "pin_bus": "24V_IN, 3V3_REG, GND_RAW, GND_REG"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_STM32F401", "name": "STM32F401 Nucleo-32 ARM Cortex-M4", "category": "MICROCONTROLLER", "image_url": "/assets/components/stm32f401.png", "specifications": "84MHz Cortex-M4 with FPU, DSP math instructions"},
                        {"component_id": "COMP_ISO3082", "name": "ISO3082 Galvanically Isolated RS-485 Transceiver", "category": "COMMUNICATION", "image_url": "/assets/components/iso3082.png", "specifications": "2.5kVRMS galvanic isolation, half duplex differential"},
                        {"component_id": "COMP_ADS1115", "name": "ADS1115 16-Bit Differential Delta-Sigma ADC", "category": "ANALOG_AFE", "image_url": "/assets/components/ads1115.png", "specifications": "16-bit resolution, 860 SPS, internal PGA"},
                        {"component_id": "COMP_PIEZO_AMP", "name": "Piezoelectric Accelerometer with Charge Amp", "category": "PIEZO_SENSOR", "image_url": "/assets/components/piezo.png", "specifications": "100mV/g sensitivity, 10kHz resonant bandwidth"},
                        {"component_id": "COMP_MAX31865", "name": "MAX31865 RTD PT100 SPI Amplifier", "category": "SPI_SENSOR", "image_url": "/assets/components/max31865.png", "specifications": "15-bit RTD-to-digital converter, 4-wire Kelvin sensing"},
                        {"component_id": "COMP_LM2596_BUCK", "name": "LM2596 Isolated 24V-to-3.3V Step-Down Buck", "category": "POWER_MODULE", "image_url": "/assets/components/buck24.png", "specifications": "High efficiency switching regulator for 24V industrial supply"},
                        {"component_id": "COMP_ESP8266", "name": "ESP8266 Module (Distractor)", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp8266.png", "specifications": "No hardware FPU/DSP for high-speed FFT analysis"},
                        {"component_id": "COMP_MAX485_RAW", "name": "MAX485 Non-Isolated (Distractor)", "category": "COMMUNICATION", "image_url": "/assets/components/max485.png", "specifications": "Lacks galvanic isolation; burns on ground potential differences"},
                        {"component_id": "COMP_NTC_10K", "name": "10k NTC Thermistor (Distractor)", "category": "SPI_SENSOR", "image_url": "/assets/components/ntc.png", "specifications": "Non-linear analog sensor (Inaccurate at 150°C motor temps)"},
                        {"component_id": "COMP_7805_LIN", "name": "Linear 7805 (Distractor)", "category": "POWER_MODULE", "image_url": "/assets/components/7805.png", "specifications": "Linear drop generates excessive heat and thermal shutdown"},
                        {"component_id": "COMP_CH340", "name": "CH340 USB-UART (Distractor)", "category": "COMMUNICATION", "image_url": "/assets/components/ch340.png", "specifications": "Single-ended consumer USB chip"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 6,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_STM32F401", "description": "STM32F401 placed in DSP MCU Socket"},
                        {"slot_id": "SLOT_RS485_BUS", "expected_component_id": "COMP_ISO3082", "description": "ISO3082 placed in RS-485 Port"},
                        {"slot_id": "SLOT_I2C_ADC", "expected_component_id": "COMP_ADS1115", "description": "ADS1115 placed in 16-Bit Diff ADC Slot"},
                        {"slot_id": "SLOT_ANALOG_IN", "expected_component_id": "COMP_PIEZO_AMP", "description": "Piezo Accelerometer placed in Transducer Header"},
                        {"slot_id": "SLOT_SPI_TEMP", "expected_component_id": "COMP_MAX31865", "description": "MAX31865 placed in RTD PT100 Header"},
                        {"slot_id": "SLOT_IND_POWER", "expected_component_id": "COMP_LM2596_BUCK", "description": "LM2596 Buck placed in 24V Buck Port"}
                    ]
                }
            },
            {
                "title": "Task 09: Automotive CAN-Bus OBD-II Telematics & Crash Logger",
                "difficulty": "Hard",
                "marks": 4.0,
                "time_limit_seconds": 300,
                "competency_code": "IOT_BUS_PROTOCOLS",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Assemble a vehicular Telematics Control Unit (TCU) that taps into the high-speed powertrain CAN network (500kbps ISO 11898-2), "
                    "records sudden deceleration and crash vectors on a +/-200g crash sensor, buffers blackbox telemetry on non-volatile SPI flash, "
                    "streams cellular coordinates to the cloud, and survives automotive load-dump alternator voltage spikes.\n\n"
                    "### Technical Specifications\n"
                    "- **SoC**: High-throughput ARM Cortex-M7 embedded controller.\n"
                    "- **Vehicle Bus**: Standalone SPI CAN Controller + High-Speed CAN Transceiver (MCP2515 + TJA1050).\n"
                    "- **Crash Sensor**: High-g 3-axis accelerometer rated up to +/-200g with hardware threshold interrupts.\n"
                    "- **Non-Volatile Storage**: 128Mbit SPI NOR Flash memory with 104MHz clock speed.\n"
                    "- **Cellular / GNSS**: Multi-band LTE Cat-M1/NB-IoT modem with GNSS positioning.\n"
                    "- **Automotive Power**: Transient Voltage Suppressor (TVS) clamping and automotive buck regulator."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-09",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-AUTO-TCU-V2",
                        "board_name": "Automotive OBD-II Telematics PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "Compute Core Socket", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, SPI0, SPI1, UART, INT"},
                            {"slot_id": "SLOT_SPI_CAN", "label": "High-Speed CAN Port (SPI0)", "supported_types": ["COMMUNICATION"], "pin_bus": "CAN_H, CAN_L, MOSI, MISO, SCK, CS (D10), INT"},
                            {"slot_id": "SLOT_SPI_IMU", "label": "High-g Crash Sensor (SPI1)", "supported_types": ["SPI_SENSOR"], "pin_bus": "MOSI, MISO, SCK, CS (D9), INT1, INT2"},
                            {"slot_id": "SLOT_SPI_STORAGE", "label": "Blackbox SPI Flash Slot", "supported_types": ["SPI_STORAGE"], "pin_bus": "MOSI, MISO, SCK, CS (D8), WP, HOLD"},
                            {"slot_id": "SLOT_UART_CELL", "label": "LTE-M & GNSS Modem Port", "supported_types": ["COMMUNICATION"], "pin_bus": "4V_VBAT, GND, TX (D0), RX (D1), PWRKEY"},
                            {"slot_id": "SLOT_AUTO_POWER", "label": "Automotive TVS Buck Port", "supported_types": ["POWER_MODULE"], "pin_bus": "12V_RAW, ISO7637_TVS, 3V3_OUT, 4V_MODEM, GND"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_TEENSY_40", "name": "Teensy 4.0 (600MHz Cortex-M7)", "category": "MICROCONTROLLER", "image_url": "/assets/components/teensy.png", "specifications": "NXP i.MX RT1062, 600MHz, 3x SPI, dual CAN controllers"},
                        {"component_id": "COMP_MCP2515_CAN", "name": "MCP2515 + TJA1050 Isolated SPI CAN Module", "category": "COMMUNICATION", "image_url": "/assets/components/can.png", "specifications": "ISO 11898-2 high-speed CAN, 500kbps-1Mbps"},
                        {"component_id": "COMP_ADXL375", "name": "ADXL375 +/-200g High-g Shock/Crash Sensor", "category": "SPI_SENSOR", "image_url": "/assets/components/adxl375.png", "specifications": "High-impact vehicular collision measurement up to 200g"},
                        {"component_id": "COMP_W25Q128", "name": "W25Q128 128Mbit SPI NOR Flash", "category": "SPI_STORAGE", "image_url": "/assets/components/w25q128.png", "specifications": "104MHz SPI, 100,000 write endurance, blackbox logging"},
                        {"component_id": "COMP_SIM7080G", "name": "SIM7080G Cat-M1/NB-IoT + GNSS Multi-Band Modem", "category": "COMMUNICATION", "image_url": "/assets/components/sim7080.png", "specifications": "LTE Cat-M1, NB-IoT, BeiDou/GPS GNSS tracking"},
                        {"component_id": "COMP_AUTO_TVS_BUCK", "name": "Automotive TVS Diode + Buck Regulator (ISO 7637-2)", "category": "POWER_MODULE", "image_url": "/assets/components/autobuck.png", "specifications": "Clamps 40V alternator load dump surges"},
                        {"component_id": "COMP_MPU6050", "name": "MPU-6050 +/-16g IMU (Distractor)", "category": "SPI_SENSOR", "image_url": "/assets/components/mpu6050.png", "specifications": "Saturates at 16g; cannot capture vehicular crash spikes"},
                        {"component_id": "COMP_MAX232", "name": "MAX232 RS-232 Transceiver (Distractor)", "category": "COMMUNICATION", "image_url": "/assets/components/max232.png", "specifications": "Single-ended bipolar serial (Incompatible with CAN)"},
                        {"component_id": "COMP_SD_CARD", "name": "MicroSD Card Slot (Distractor)", "category": "SPI_STORAGE", "image_url": "/assets/components/sd.png", "specifications": "Mechanical contacts dislodge during vehicular crash shock"},
                        {"component_id": "COMP_ESP8266_RAW", "name": "ESP8266 SoC (Distractor)", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp8266.png", "specifications": "Single SPI without DMA, unable to process CAN stream"},
                        {"component_id": "COMP_7812_LIN", "name": "Linear 12V 7812 (Distractor)", "category": "POWER_MODULE", "image_url": "/assets/components/7812.png", "specifications": "Destroys circuit on alternator load dump"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 6,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_TEENSY_40", "description": "Teensy 4.0 placed in Compute Core Socket"},
                        {"slot_id": "SLOT_SPI_CAN", "expected_component_id": "COMP_MCP2515_CAN", "description": "MCP2515 placed in High-Speed CAN Port"},
                        {"slot_id": "SLOT_SPI_IMU", "expected_component_id": "COMP_ADXL375", "description": "ADXL375 placed in Crash Sensor Slot"},
                        {"slot_id": "SLOT_SPI_STORAGE", "expected_component_id": "COMP_W25Q128", "description": "W25Q128 placed in Blackbox Flash Slot"},
                        {"slot_id": "SLOT_UART_CELL", "expected_component_id": "COMP_SIM7080G", "description": "SIM7080G placed in Modem Port"},
                        {"slot_id": "SLOT_AUTO_POWER", "expected_component_id": "COMP_AUTO_TVS_BUCK", "description": "TVS Buck placed in Automotive Power Port"}
                    ]
                }
            },
            {
                "title": "Task 10: Smart Grid AC Mains Harmonics Analyzer & Arc-Suppressed Safety Hub",
                "difficulty": "Hard",
                "marks": 4.0,
                "time_limit_seconds": 300,
                "competency_code": "IOT_POWER_ISOLATION",
                "candidate_content": (
                    "### Problem Statement\n"
                    "Develop an electrical substation monitoring gateway capable of calculating true RMS voltage, active/reactive power, total "
                    "harmonic distortion (THD up to the 31st harmonic), detecting ground leakage current, and executing arc-suppressed solid-state circuit breaking.\n\n"
                    "### Technical Specifications\n"
                    "- **Processing SoC**: Dual-core 240MHz SoC with vector acceleration for real-time FFT computations.\n"
                    "- **Voltage Transducer**: Precision isolated voltage potential transformer (ZMPT101B) with op-amp phase tuning.\n"
                    "- **Current Transducer**: Non-invasive 100A split-core current transformer (CT).\n"
                    "- **Analog Front-End**: 16-bit I2C Delta-Sigma ADC with low noise differential inputs.\n"
                    "- **Phase Synchronization**: Optical zero-crossing detection circuit (H11AA1).\n"
                    "- **High-Power Actuator**: Optocoupled Solid State Relay (SSR-40DA) with integrated RC snubber.\n"
                    "- **Auxiliary Power**: Galvanically isolated 230VAC to 5VDC medical/industrial power converter."
                ),
                "options_json": {
                    "task_id": "IOT-TASK-10",
                    "domain": "iot-hardware-systems",
                    "round_type": "HARDWARE_SELECTION_PLACEMENT",
                    "motherboard_config": {
                        "board_id": "BOARD-GRID-SUBSTATION-V1",
                        "board_name": "Smart Grid Power Telemetry PCB",
                        "slots": [
                            {"slot_id": "SLOT_MCU", "label": "Dual-Core Vector MCU Socket", "supported_types": ["MICROCONTROLLER"], "pin_bus": "3.3V, GND, I2C, SPI, GPIO, INT"},
                            {"slot_id": "SLOT_AC_VOLTAGE", "label": "Voltage Transformer Header", "supported_types": ["VOLTAGE_AFE"], "pin_bus": "AC_L, AC_N, V_SIG (Analog 0-3.3V), GND"},
                            {"slot_id": "SLOT_AC_CURRENT", "label": "Current Transformer Header", "supported_types": ["CURRENT_AFE"], "pin_bus": "CT_IN+, CT_IN-, I_SIG (Analog 0-3.3V), GND"},
                            {"slot_id": "SLOT_I2C_ADC", "label": "16-Bit Harmonic ADC Port", "supported_types": ["ANALOG_AFE"], "pin_bus": "3.3V, GND, SCL, SDA, AIN0, AIN1"},
                            {"slot_id": "SLOT_ZERO_CROSS", "label": "Zero-Cross Optical Sync Port", "supported_types": ["SYNC_OPTO"], "pin_bus": "AC_L, AC_N, ZERO_PULSE (GPIO15), 3.3V"},
                            {"slot_id": "SLOT_SSR_TRIP", "label": "Solid State Relay Output", "supported_types": ["ACTUATOR_SSR"], "pin_bus": "TRIP_SIG (GPIO13), GND, AC_LOAD_L, AC_LOAD_N"},
                            {"slot_id": "SLOT_AC_POWER", "label": "Isolated 230V AC-DC Module", "supported_types": ["POWER_MODULE"], "pin_bus": "AC_IN_L, AC_IN_N, 5V_SYS, GND"}
                        ]
                    },
                    "component_palette": [
                        {"component_id": "COMP_ESP32_S3_VECTOR", "name": "ESP32-S3 Dual-Core 240MHz (Vector Instructions)", "category": "MICROCONTROLLER", "image_url": "/assets/components/esp32s3.png", "specifications": "Xtensa dual-core with SIMD vector extensions for 31-harmonic FFT"},
                        {"component_id": "COMP_ZMPT101B", "name": "ZMPT101B Precision Isolated Voltage Transformer", "category": "VOLTAGE_AFE", "image_url": "/assets/components/zmpt101b.png", "specifications": "230V AC galvanic voltage isolation + precision op-amp phase adjustment"},
                        {"component_id": "COMP_SCT013_100A", "name": "SCT-013-000 Non-Invasive 100A Current Transformer", "category": "CURRENT_AFE", "image_url": "/assets/components/sct013.png", "specifications": "0-100A AC current measurement, ferrite split core"},
                        {"component_id": "COMP_ADS1115_ADC", "name": "ADS1115 16-Bit I2C ADC (High Dynamic Range)", "category": "ANALOG_AFE", "image_url": "/assets/components/ads1115.png", "specifications": "16-bit low noise Delta-Sigma ADC for harmonic extraction"},
                        {"component_id": "COMP_H11AA1_ZC", "name": "Zero-Crossing Optical Detector (H11AA1)", "category": "SYNC_OPTO", "image_url": "/assets/components/h11aa1.png", "specifications": "Bi-directional optocoupler producing 100Hz/120Hz sync pulses"},
                        {"component_id": "COMP_SSR40DA", "name": "Opto-Isolated Solid State Relay (SSR-40DA)", "category": "ACTUATOR_SSR", "image_url": "/assets/components/ssr40.png", "specifications": "40A 380VAC solid-state switching with integrated RC snubber"},
                        {"component_id": "COMP_ISOLATED_ACDC", "name": "Isolated 230V-to-5V Industrial Power Module", "category": "POWER_MODULE", "image_url": "/assets/components/hlk.png", "specifications": "4000VAC isolation barrier, ultra-low electromagnetic ripple"},
                        {"component_id": "COMP_RAW_RESISTOR_DIVIDER", "name": "Direct Resistor Voltage Divider 230V (Distractor)", "category": "VOLTAGE_AFE", "image_url": "/assets/components/resistor.png", "specifications": "Zero galvanic isolation (Lethal shock hazard)"},
                        {"component_id": "COMP_ACS712", "name": "ACS712 Hall Effect Current Module (Distractor)", "category": "CURRENT_AFE", "image_url": "/assets/components/acs712.png", "specifications": "Invasive board layout, low dielectric voltage rating"},
                        {"component_id": "COMP_MECH_RELAY_RAW", "name": "Mechanical 5V Relay (Distractor)", "category": "ACTUATOR_SSR", "image_url": "/assets/components/relay.png", "specifications": "Contact arcing and welding hazard on heavy inductive AC loads"},
                        {"component_id": "COMP_ATMEGA328P", "name": "ATmega328P 8-Bit (Distractor)", "category": "MICROCONTROLLER", "image_url": "/assets/components/atmega.png", "specifications": "Cannot perform 31-harmonic FFT calculations in real time"},
                        {"component_id": "COMP_CAP_DROPPER", "name": "Capacitive Dropper Power Supply (Distractor)", "category": "POWER_MODULE", "image_url": "/assets/components/capdrop.png", "specifications": "Non-isolated AC supply (Dangerous on industrial equipment)"}
                    ]
                },
                "eval_config": {
                    "evaluation_type": "HARDWARE_SLOT_MATCH",
                    "total_required_count": 7,
                    "required_placements": [
                        {"slot_id": "SLOT_MCU", "expected_component_id": "COMP_ESP32_S3_VECTOR", "description": "ESP32-S3 placed in Vector MCU Socket"},
                        {"slot_id": "SLOT_AC_VOLTAGE", "expected_component_id": "COMP_ZMPT101B", "description": "ZMPT101B placed in Voltage Transformer Header"},
                        {"slot_id": "SLOT_AC_CURRENT", "expected_component_id": "COMP_SCT013_100A", "description": "SCT-013 placed in Current Transformer Header"},
                        {"slot_id": "SLOT_I2C_ADC", "expected_component_id": "COMP_ADS1115_ADC", "description": "ADS1115 placed in 16-Bit ADC Port"},
                        {"slot_id": "SLOT_ZERO_CROSS", "expected_component_id": "COMP_H11AA1_ZC", "description": "H11AA1 placed in Zero-Cross Sync Port"},
                        {"slot_id": "SLOT_SSR_TRIP", "expected_component_id": "COMP_SSR40DA", "description": "SSR-40DA placed in Solid State Relay Output"},
                        {"slot_id": "SLOT_AC_POWER", "expected_component_id": "COMP_ISOLATED_ACDC", "description": "Isolated AC-DC placed in Power Module Port"}
                    ]
                }
            }
        ]

        for task in tasks_dataset:
            title = task["title"]
            comp_code = task["competency_code"]
            comp_id = comp_map.get(comp_code)

            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == round_obj.id,
                AssessmentQuestion.title == title
            ).first()

            if not q:
                q = AssessmentQuestion(
                    round_id=round_obj.id,
                    competency_id=comp_id,
                    question_type="HARDWARE_SELECTION_PLACEMENT",
                    title=title,
                    candidate_content=task["candidate_content"],
                    options_json=task["options_json"],
                    difficulty=task["difficulty"],
                    marks=task["marks"],
                    time_limit_seconds=task["time_limit_seconds"],
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()
                print(f"  + Created Question: [{task['difficulty']}] {title}")
            else:
                q.competency_id = comp_id
                q.candidate_content = task["candidate_content"]
                q.options_json = task["options_json"]
                q.difficulty = task["difficulty"]
                q.marks = task["marks"]
                q.time_limit_seconds = task["time_limit_seconds"]
                q.status = "Active"
                db.flush()
                print(f"  * Updated Question: [{task['difficulty']}] {title}")

            # Upsert Evaluation Config
            cfg_data = task["eval_config"]
            cfg = db.query(QuestionEvaluationConfig).filter(
                QuestionEvaluationConfig.question_id == q.id
            ).first()

            if not cfg:
                cfg = QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type=cfg_data["evaluation_type"],
                    scoring_rules_json=cfg_data,
                    reference_solution=json.dumps(cfg_data["required_placements"], indent=2)
                )
                db.add(cfg)
                db.flush()
            else:
                cfg.evaluation_type = cfg_data["evaluation_type"]
                cfg.scoring_rules_json = cfg_data
                cfg.reference_solution = json.dumps(cfg_data["required_placements"], indent=2)
                db.flush()

        db.commit()
        print("\n" + "=" * 80)
        print("SUCCESSFULLY SEEDED IOT HARDWARE ENGINEERING DOMAIN & 10 TASKS")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Failed to seed IoT Hardware Domain: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_iot_hardware_domain()
