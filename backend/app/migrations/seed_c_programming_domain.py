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
    QuestionVersion,
    AssessmentActivationRequest,
    AssessmentStudentAllocation
)

def seed_c_domain():
    print("=" * 80)
    print("SEEDING DEDICATED DOMAIN 4: C & SYSTEMS PROGRAMMING MASTER TRACK")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed / Upsert Competencies
        print("\n[STEP 1] Seeding Competencies...")
        competencies_data = [
            ("APT_NUM", "Numerical Reasoning & Arithmetic Basics", "Aptitude", "Foundational arithmetic, ratios, percentages, time-speed-distance, and algebraic calculations."),
            ("APT_LOGIC", "Logical Deductions & Series Patterns", "Aptitude", "Sequence deduction, syllogisms, pattern extrapolation, and relationship reasoning."),
            ("APT_ALGO", "Flow Logic & Algorithmic Deductions", "Aptitude", "Flowchart logic, condition trees, and loop execution deduction."),
            ("C_SYNTAX", "C Core Syntax & Control Flow", "Core Programming", "Variables, data types, operators, conditionals, iteration, and preprocessor directives."),
            ("C_POINTERS", "Pointer Arithmetic & Memory Addressing", "Systems Programming", "Pointer dereferencing, double pointers, array-pointer duality, and address math."),
            ("C_STRUCTS", "Structures, Unions & Bitfields", "Systems Programming", "Composite structures, alignment, memory layout, unions, and bitfields."),
            ("C_ALGO", "Dynamic Memory & Data Structures in C", "Data Structures", "malloc/calloc/free heap management, strings, dynamic arrays, and linked lists in C."),
            ("C_DEBUG", "C Memory Safety & Segfault Diagnosis", "Debugging & Quality", "Fixing segmentation faults, dangling pointers, buffer overflows, and memory leaks.")
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

        # 2. Seed / Upsert Domain 4
        print("\n[STEP 2] Seeding Assessment Domain...")
        domain_slug = "c-programming-track"
        domain = db.query(AssessmentDomain).filter(AssessmentDomain.slug == domain_slug).first()
        if not domain:
            domain = AssessmentDomain(
                slug=domain_slug,
                title="C & Systems Programming Master Track",
                description="Comprehensive multi-round benchmark evaluating quantitative & logical aptitude, core C language constructs, pointer arithmetic, memory management (malloc/free), and systems debugging.",
                is_active=True
            )
            db.add(domain)
            db.flush()
            print(f"  + Created Assessment Domain: {domain.title} (slug: {domain.slug})")
        else:
            domain.title = "C & Systems Programming Master Track"
            domain.description = "Comprehensive multi-round benchmark evaluating quantitative & logical aptitude, core C language constructs, pointer arithmetic, memory management (malloc/free), and systems debugging."
            domain.is_active = True
            db.flush()
            print(f"  * Updated Assessment Domain: {domain.title}")

        # 3. Seed Rounds & Policies
        print("\n[STEP 3] Seeding Rounds and Assessment Policies...")
        rounds_config = [
            {
                "round_number": 1,
                "slug": "round-1-basic-aptitude",
                "title": "Round 1: Foundational Quantitative & Logical Aptitude",
                "description": "Evaluate numerical agility, arithmetic reasoning, percentages, ratios, number patterns, and basic algorithmic deduction logic.",
                "round_type": "DATA_APTITUDE_MCQ",
                "duration_minutes": 30,
                "questions_per_attempt": 15,
                "passing_score": 60.0,
                "weightage_percent": 20.0,
                "min_score_percent": 50.0,
                "mandatory_pass": True
            },
            {
                "round_number": 2,
                "slug": "round-2-c-fundamentals",
                "title": "Round 2: C Language Syntax, Pointers & Memory Fundamentals",
                "description": "Test understanding of pointer dereferencing, pointer arithmetic, memory layout, storage classes, structs, unions, bitwise operators, and preprocessor macros.",
                "round_type": "TECHNICAL_MCQ",
                "duration_minutes": 30,
                "questions_per_attempt": 15,
                "passing_score": 65.0,
                "weightage_percent": 25.0,
                "min_score_percent": 50.0,
                "mandatory_pass": True
            },
            {
                "round_number": 3,
                "slug": "round-3-c-coding",
                "title": "Round 3: Core C Algorithmic Coding",
                "description": "Hands-on C program implementation testing string manipulation, dynamic memory allocation with malloc, and pointer manipulation.",
                "round_type": "CODING",
                "duration_minutes": 45,
                "questions_per_attempt": 3,
                "passing_score": 60.0,
                "weightage_percent": 30.0,
                "min_score_percent": 50.0,
                "mandatory_pass": True
            },
            {
                "round_number": 4,
                "slug": "round-4-c-debugging",
                "title": "Round 4: C Memory Safety & Systems Debugging",
                "description": "Inspect and fix buggy C source code containing segmentation faults, off-by-one pointer arithmetic, and uninitialized pointers.",
                "round_type": "DEBUGGING",
                "duration_minutes": 35,
                "questions_per_attempt": 2,
                "passing_score": 65.0,
                "weightage_percent": 25.0,
                "min_score_percent": 50.0,
                "mandatory_pass": True
            }
        ]

        round_obj_map = {}
        for rc in rounds_config:
            rnd = db.query(AssessmentRound).filter(
                AssessmentRound.domain_id == domain.id,
                AssessmentRound.round_number == rc["round_number"]
            ).first()

            if not rnd:
                rnd = AssessmentRound(
                    domain_id=domain.id,
                    round_number=rc["round_number"],
                    slug=rc["slug"],
                    title=rc["title"],
                    description=rc["description"],
                    round_type=rc["round_type"],
                    duration_minutes=rc["duration_minutes"],
                    questions_per_attempt=rc["questions_per_attempt"],
                    rules_json={"allow_review": True, "shuffle_questions": False}
                )
                db.add(rnd)
                db.flush()
                print(f"  + Created Round {rnd.round_number}: {rnd.title}")
            else:
                rnd.slug = rc["slug"]
                rnd.title = rc["title"]
                rnd.description = rc["description"]
                rnd.round_type = rc["round_type"]
                rnd.duration_minutes = rc["duration_minutes"]
                rnd.questions_per_attempt = rc["questions_per_attempt"]
                db.flush()
                print(f"  * Updated Round {rnd.round_number}: {rnd.title}")

            round_obj_map[rc["round_number"]] = rnd

            # Upsert Policy
            pol = db.query(AssessmentPolicy).filter(AssessmentPolicy.round_id == rnd.id).first()
            if not pol:
                pol = AssessmentPolicy(
                    round_id=rnd.id,
                    passing_score=rc["passing_score"],
                    weightage_percent=rc["weightage_percent"],
                    min_score_percent=rc["min_score_percent"],
                    mandatory_pass=rc["mandatory_pass"]
                )
                db.add(pol)
                db.flush()
            else:
                pol.passing_score = rc["passing_score"]
                pol.weightage_percent = rc["weightage_percent"]
                pol.min_score_percent = rc["min_score_percent"]
                pol.mandatory_pass = rc["mandatory_pass"]
                db.flush()

        # 4. Seed Questions
        print("\n[STEP 4] Seeding Round Questions & Test Cases...")

        # --- Round 1: Basic Aptitude (15 MCQs) ---
        r1 = round_obj_map[1]
        r1_questions = [
            {
                "title": "Ratio & Proportion Division",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "Two numbers are in the ratio 4 : 5. If their sum is 180, what is the value of the larger number?",
                "options": ["80", "90", "100", "110"],
                "correct": "100",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Percentage Profit Calculation",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "An item purchased for $400 is sold for $500. What is the percentage profit gained on this transaction?",
                "options": ["20%", "25%", "30%", "15%"],
                "correct": "25%",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Arithmetic Progression Series",
                "competency": "APT_LOGIC",
                "question_type": "MCQ",
                "content": "Identify the next number in the sequence: 3, 6, 12, 24, 48, ___",
                "options": ["64", "72", "96", "84"],
                "correct": "96",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Combined Work Rate",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "Worker A can finish a project in 6 days, while Worker B takes 12 days for the same project. Working together, how many days will they take to complete it?",
                "options": ["4 days", "3 days", "5 days", "4.5 days"],
                "correct": "4 days",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Speed, Distance and Time",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "A train 150 meters long travels at a constant speed of 54 km/h. How many seconds does it take to cross a stationary signal pole?",
                "options": ["10 seconds", "12 seconds", "15 seconds", "8 seconds"],
                "correct": "10 seconds",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Simple Interest Accrual",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "What is the Simple Interest on a principal amount of $5,000 invested at an annual rate of 10% for a period of 3 years?",
                "options": ["$1,200", "$1,500", "$1,650", "$1,800"],
                "correct": "$1,500",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Arithmetic Mean of Integer Set",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "Find the average (arithmetic mean) of the numbers: 12, 18, 24, 30, and 36.",
                "options": ["22", "24", "26", "28"],
                "correct": "24",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Dice Roll Probability",
                "competency": "APT_LOGIC",
                "question_type": "MCQ",
                "content": "When two standard six-sided dice are rolled simultaneously, what is the probability that the sum of the rolled numbers is exactly 7?",
                "options": ["1/6", "1/12", "5/36", "7/36"],
                "correct": "1/6",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Pattern Coding & Transposition",
                "competency": "APT_LOGIC",
                "question_type": "MCQ",
                "content": "If the word 'SYSTEM' is encoded as 'SYSMET' by reversing the second half of the word, how will 'FORMAT' be encoded under the exact same rule?",
                "options": ["FORTAM", "FORATM", "TAMFOR", "FORTMA"],
                "correct": "FORTAM",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Family Tree Logical Deduction",
                "competency": "APT_LOGIC",
                "question_type": "MCQ",
                "content": "Pointing to a photograph, a woman says: 'He is the only son of the mother of my only brother.' How is the man in the photograph related to the woman?",
                "options": ["Brother", "Father", "Uncle", "Nephew"],
                "correct": "Brother",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Categorical Syllogism",
                "competency": "APT_LOGIC",
                "question_type": "MCQ",
                "content": "Premises:\n1. All squares are rectangles.\n2. All rectangles are polygons.\nConclusion: Which statement is strictly valid?",
                "options": ["All squares are polygons", "All polygons are squares", "Some polygons are not rectangles", "No rectangles are squares"],
                "correct": "All squares are polygons",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Linear Age Relationship",
                "competency": "APT_NUM",
                "question_type": "MCQ",
                "content": "A father is currently 3 times as old as his son. In 12 years, the father will be twice as old as his son. What is the son's current age?",
                "options": ["10 years", "12 years", "14 years", "16 years"],
                "correct": "12 years",
                "marks": 1.0,
                "difficulty": "Medium"
            },
            {
                "title": "Analog Clock Hand Angle",
                "competency": "APT_LOGIC",
                "question_type": "MCQ",
                "content": "What is the acute angle between the hour hand and minute hand of a clock at 3:30?",
                "options": ["75°", "70°", "80°", "90°"],
                "correct": "75°",
                "marks": 1.0,
                "difficulty": "Medium"
            },
            {
                "title": "Iterative Loop Sum Deduction",
                "competency": "APT_ALGO",
                "question_type": "MCQ",
                "content": "Consider this algorithmic step:\nlet sum = 0;\nfor (i = 1 to 4) {\n  sum = sum + (i * i);\n}\nWhat is the final value of sum?",
                "options": ["20", "30", "14", "25"],
                "correct": "30",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Conditional Discount Flow Deduction",
                "competency": "APT_ALGO",
                "question_type": "MCQ",
                "content": "A billing algorithm states: 'If total > 500 give 20% discount; else if total > 200 give 10% discount; else give 0% discount.' What is the final payable amount for a cart value of exactly $500?",
                "options": ["$400", "$450", "$500", "$425"],
                "correct": "$450",
                "marks": 1.0,
                "difficulty": "Easy"
            }
        ]

        for q_data in r1_questions:
            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == r1.id,
                AssessmentQuestion.title == q_data["title"]
            ).first()

            if not q:
                q = AssessmentQuestion(
                    round_id=r1.id,
                    competency_id=comp_map.get(q_data["competency"]),
                    question_type=q_data["question_type"],
                    title=q_data["title"],
                    candidate_content=q_data["content"],
                    options_json=q_data["options"],
                    difficulty=q_data["difficulty"],
                    marks=q_data["marks"],
                    time_limit_seconds=90,
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()

                cfg = QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type="ExactMatch",
                    correct_answer=q_data["correct"],
                    scoring_rules_json={"case_sensitive": False}
                )
                db.add(cfg)
                db.flush()

        print(f"  -> Seeded {len(r1_questions)} questions for Round 1 (Foundational Aptitude)")

        # --- Round 2: C Language Fundamentals (15 MCQs) ---
        r2 = round_obj_map[2]
        r2_questions = [
            {
                "title": "Pointer Dereference and Modification",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "What is the output of the following C code snippet?\n\nint x = 10;\nint *ptr = &x;\n*ptr += 5;\nprintf(\"%d\", x);",
                "options": ["10", "15", "Garbage value", "Compilation Error"],
                "correct": "15",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Pointer Arithmetic Stride",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "On a standard 64-bit architecture where sizeof(int) == 4 bytes, if ptr points to memory address 0x1000, what address will (ptr + 2) evaluate to?",
                "options": ["0x1002", "0x1004", "0x1008", "0x1010"],
                "correct": "0x1008",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Array Identifier Decay",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "Given 'int arr[5] = {1, 2, 3, 4, 5};', which of the following expressions is equivalent to '*(arr + 3)'?",
                "options": ["arr[3]", "&arr[3]", "arr + 3", "*arr + 3"],
                "correct": "arr[3]",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Double Pointer Indirection",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "What is printed by this code snippet?\n\nint a = 5;\nint *p = &a;\nint **pp = &p;\n**pp = 20;\nprintf(\"%d\", a);",
                "options": ["5", "20", "Memory address", "Compiler Error"],
                "correct": "20",
                "marks": 1.0,
                "difficulty": "Medium"
            },
            {
                "title": "Pointer Variable Size",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "What is the value of 'sizeof(char*)' on a target 64-bit operating system?",
                "options": ["1 byte", "4 bytes", "8 bytes", "Depends on string length"],
                "correct": "8 bytes",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Bitwise Left Shift Operator",
                "competency": "C_SYNTAX",
                "question_type": "MCQ",
                "content": "What is the result of the bitwise expression '8 << 2' in C?",
                "options": ["16", "32", "64", "4"],
                "correct": "32",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Macro Parenthesization Hazard",
                "competency": "C_SYNTAX",
                "question_type": "MCQ",
                "content": "Given:\n#define SQUARE(x) x * x\nWhat is the output of 'printf(\"%d\", SQUARE(2 + 3));'?",
                "options": ["25", "11", "13", "10"],
                "correct": "11",
                "marks": 1.0,
                "difficulty": "Medium"
            },
            {
                "title": "Static Variable Lifetime",
                "competency": "C_SYNTAX",
                "question_type": "MCQ",
                "content": "What is printed when 'counter()' is called twice in main?\n\nvoid counter() {\n    static int c = 0;\n    c++;\n    printf(\"%d \", c);\n}",
                "options": ["1 1 ", "1 2 ", "0 1 ", "2 2 "],
                "correct": "1 2 ",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "String Literal Memory Size",
                "competency": "C_SYNTAX",
                "question_type": "MCQ",
                "content": "What is the value returned by 'sizeof(\"HELLO\")' in C?",
                "options": ["5", "6", "4", "8"],
                "correct": "6",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Structure vs Union Memory Layout",
                "competency": "C_STRUCTS",
                "question_type": "MCQ",
                "content": "What is the primary difference in memory allocation between a 'struct' and a 'union' in C?",
                "options": [
                    "A union allocates memory only for its largest member, sharing space among all members",
                    "A struct can only contain primitive data types whereas a union can contain pointers",
                    "A union allocates the sum of all members plus padding",
                    "There is no difference in memory allocation"
                ],
                "correct": "A union allocates memory only for its largest member, sharing space among all members",
                "marks": 1.0,
                "difficulty": "Medium"
            },
            {
                "title": "malloc Return Value & Type",
                "competency": "C_ALGO",
                "question_type": "MCQ",
                "content": "What generic pointer type is returned by the standard library function 'malloc(size_t size)' in C?",
                "options": ["char*", "void*", "int*", "NULL*"],
                "correct": "void*",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Dangling Pointer Definition",
                "competency": "C_DEBUG",
                "question_type": "MCQ",
                "content": "What is a 'dangling pointer' in C?",
                "options": [
                    "A pointer that points to a deallocated/freed memory location",
                    "A pointer initialized to NULL",
                    "A pointer pointing to address 0x00000000",
                    "A pointer that has not been initialized"
                ],
                "correct": "A pointer that points to a deallocated/freed memory location",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Pointer to Const vs Const Pointer",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "In the declaration 'const int *ptr;', which of the following operations is forbidden by the C compiler?",
                "options": [
                    "*ptr = 25;",
                    "ptr = &another_var;",
                    "ptr++;",
                    "int val = *ptr;"
                ],
                "correct": "*ptr = 25;",
                "marks": 1.0,
                "difficulty": "Medium"
            },
            {
                "title": "Bitwise In-place XOR Swap",
                "competency": "C_SYNTAX",
                "question_type": "MCQ",
                "content": "What happens after executing:\na ^= b;\nb ^= a;\na ^= b;\n(Assuming a and b are distinct integer variables)?",
                "options": [
                    "The values of a and b are swapped without temporary memory",
                    "Both a and b become 0",
                    "Both a and b become -1",
                    "a retains its value, b becomes 0"
                ],
                "correct": "The values of a and b are swapped without temporary memory",
                "marks": 1.0,
                "difficulty": "Easy"
            },
            {
                "title": "Function Pointer Declaration",
                "competency": "C_POINTERS",
                "question_type": "MCQ",
                "content": "Which declaration correctly defines a function pointer named 'funcPtr' that takes two ints as parameters and returns an int?",
                "options": [
                    "int (*funcPtr)(int, int);",
                    "int *funcPtr(int, int);",
                    "int (funcPtr*)(int, int);",
                    "(*int funcPtr)(int, int);"
                ],
                "correct": "int (*funcPtr)(int, int);",
                "marks": 1.0,
                "difficulty": "Medium"
            }
        ]

        for q_data in r2_questions:
            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == r2.id,
                AssessmentQuestion.title == q_data["title"]
            ).first()

            if not q:
                q = AssessmentQuestion(
                    round_id=r2.id,
                    competency_id=comp_map.get(q_data["competency"]),
                    question_type=q_data["question_type"],
                    title=q_data["title"],
                    candidate_content=q_data["content"],
                    options_json=q_data["options"],
                    difficulty=q_data["difficulty"],
                    marks=q_data["marks"],
                    time_limit_seconds=90,
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()

                cfg = QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type="ExactMatch",
                    correct_answer=q_data["correct"],
                    scoring_rules_json={"case_sensitive": False}
                )
                db.add(cfg)
                db.flush()

        print(f"  -> Seeded {len(r2_questions)} questions for Round 2 (C Fundamentals)")

        # --- Round 3: Hands-on C Coding (3 Questions) ---
        r3 = round_obj_map[3]
        r3_questions = [
            {
                "title": "In-Place String Reversal using Two Pointers",
                "competency": "C_ALGO",
                "question_type": "Coding",
                "content": "Implement a C program that reads a string from standard input and prints the reversed string to standard output using a two-pointer approach.\n\nInput Example:\nhello\n\nOutput Example:\nolleh",
                "template": """#include <stdio.h>
#include <string.h>

void reverseString(char *str) {
    int left = 0;
    int right = strlen(str) - 1;
    while (left < right) {
        char temp = str[left];
        str[left] = str[right];
        str[right] = temp;
        left++;
        right--;
    }
}

int main() {
    char str[1000];
    if (scanf("%s", str) == 1) {
        reverseString(str);
        printf("%s", str);
    }
    return 0;
}
""",
                "public_tests": [
                    {"input": "hello", "expected_output": "olleh"},
                    {"input": "system", "expected_output": "metsys"}
                ],
                "hidden_tests": [
                    {"input": "a", "expected_output": "a"},
                    {"input": "algorithms", "expected_output": "smhtirogla"}
                ],
                "marks": 10.0,
                "difficulty": "Medium"
            },
            {
                "title": "Dynamic Array Min-Max Finder",
                "competency": "C_ALGO",
                "question_type": "Coding",
                "content": "Write a C program that reads an integer N followed by N integers. Allocate memory dynamically using malloc(), find the minimum and maximum elements in the array, and print them formatted as 'Min: X, Max: Y'.\n\nInput Example:\n5\n10 25 5 40 15\n\nOutput Example:\nMin: 5, Max: 40",
                "template": """#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1 || n <= 0) return 0;
    
    int *arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        scanf("%d", &arr[i]);
    }
    
    int min = arr[0];
    int max = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] < min) min = arr[i];
        if (arr[i] > max) max = arr[i];
    }
    
    printf("Min: %d, Max: %d", min, max);
    free(arr);
    return 0;
}
""",
                "public_tests": [
                    {"input": "5\n10 25 5 40 15", "expected_output": "Min: 5, Max: 40"},
                    {"input": "3\n100 200 50", "expected_output": "Min: 50, Max: 200"}
                ],
                "hidden_tests": [
                    {"input": "1\n42", "expected_output": "Min: 42, Max: 42"},
                    {"input": "4\n-10 -50 0 30", "expected_output": "Min: -50, Max: 30"}
                ],
                "marks": 10.0,
                "difficulty": "Medium"
            },
            {
                "title": "Character Frequency Counter",
                "competency": "C_ALGO",
                "question_type": "Coding",
                "content": "Write a C program that reads a string and a target character. Count and print the total occurrences of the target character in the string.\n\nInput Example:\nprogramming\nm\n\nOutput Example:\n2",
                "template": """#include <stdio.h>
#include <string.h>

int countOccurrences(const char *str, char target) {
    int count = 0;
    while (*str) {
        if (*str == target) count++;
        str++;
    }
    return count;
}

int main() {
    char str[1000];
    char target;
    if (scanf("%s %c", str, &target) == 2) {
        printf("%d", countOccurrences(str, target));
    }
    return 0;
}
""",
                "public_tests": [
                    {"input": "programming m", "expected_output": "2"},
                    {"input": "assessment s", "expected_output": "4"}
                ],
                "hidden_tests": [
                    {"input": "hello z", "expected_output": "0"},
                    {"input": "embedded d", "expected_output": "3"}
                ],
                "marks": 10.0,
                "difficulty": "Easy"
            }
        ]

        for q_data in r3_questions:
            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == r3.id,
                AssessmentQuestion.title == q_data["title"]
            ).first()

            if not q:
                q = AssessmentQuestion(
                    round_id=r3.id,
                    competency_id=comp_map.get(q_data["competency"]),
                    question_type=q_data["question_type"],
                    title=q_data["title"],
                    candidate_content=q_data["content"],
                    candidate_code_template=q_data["template"],
                    difficulty=q_data["difficulty"],
                    marks=q_data["marks"],
                    time_limit_seconds=180,
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()

                cfg = QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type="CodeSandbox",
                    reference_solution=q_data["template"],
                    public_test_cases_json=q_data["public_tests"],
                    hidden_test_cases_json=q_data["hidden_tests"],
                    scoring_rules_json={"language": "c", "pass_threshold": 1.0}
                )
                db.add(cfg)
                db.flush()

        print(f"  -> Seeded {len(r3_questions)} coding questions for Round 3 (C Coding)")

        # --- Round 4: C Memory Safety & Debugging (2 Questions) ---
        r4 = round_obj_map[4]
        r4_questions = [
            {
                "title": "Fix String Copy Buffer & Missing Null Terminator",
                "competency": "C_DEBUG",
                "question_type": "Debug",
                "content": "The following C program attempts to copy an input string to an allocated buffer, but contains an off-by-one boundary error and missing null termination causing undefined behavior. Fix the bug so that the string copies safely and matches the expected output.\n\nInput Example:\nsystems\n\nOutput Example:\nsystems",
                "template": """#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// BUGGY CODE: Fix memory allocation & null termination
int main() {
    char input[100];
    if (scanf("%s", input) != 1) return 0;
    
    int len = strlen(input);
    // FIX: Allocate len + 1 for null terminator
    char *copy = (char*)malloc((len + 1) * sizeof(char));
    
    for (int i = 0; i < len; i++) {
        copy[i] = input[i];
    }
    copy[len] = '\\0'; // FIX: Ensure null-termination
    
    printf("%s", copy);
    free(copy);
    return 0;
}
""",
                "public_tests": [
                    {"input": "systems", "expected_output": "systems"},
                    {"input": "kernel", "expected_output": "kernel"}
                ],
                "hidden_tests": [
                    {"input": "memory", "expected_output": "memory"},
                    {"input": "pointer", "expected_output": "pointer"}
                ],
                "marks": 10.0,
                "difficulty": "Medium"
            },
            {
                "title": "Fix Binary Search Infinite Loop Indexing",
                "competency": "C_DEBUG",
                "question_type": "Debug",
                "content": "The following C binary search implementation hangs in an infinite loop due to improper boundary updates. Fix the search logic so that it prints the 0-based index of the target integer, or -1 if not found.\n\nInput Example:\n5\n10 20 30 40 50\n30\n\nOutput Example:\n2",
                "template": """#include <stdio.h>

int binarySearch(int arr[], int n, int target) {
    int low = 0;
    int high = n - 1;
    
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            low = mid + 1; // FIX: increment low
        } else {
            high = mid - 1; // FIX: decrement high
        }
    }
    return -1;
}

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int arr[100];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    int target;
    if (scanf("%d", &target) != 1) return 0;
    
    printf("%d", binarySearch(arr, n, target));
    return 0;
}
""",
                "public_tests": [
                    {"input": "5\n10 20 30 40 50\n30", "expected_output": "2"},
                    {"input": "4\n2 4 6 8\n9", "expected_output": "-1"}
                ],
                "hidden_tests": [
                    {"input": "3\n1 3 5\n1", "expected_output": "0"},
                    {"input": "3\n1 3 5\n5", "expected_output": "2"}
                ],
                "marks": 10.0,
                "difficulty": "Medium"
            }
        ]

        for q_data in r4_questions:
            q = db.query(AssessmentQuestion).filter(
                AssessmentQuestion.round_id == r4.id,
                AssessmentQuestion.title == q_data["title"]
            ).first()

            if not q:
                q = AssessmentQuestion(
                    round_id=r4.id,
                    competency_id=comp_map.get(q_data["competency"]),
                    question_type=q_data["question_type"],
                    title=q_data["title"],
                    candidate_content=q_data["content"],
                    candidate_code_template=q_data["template"],
                    difficulty=q_data["difficulty"],
                    marks=q_data["marks"],
                    time_limit_seconds=180,
                    version=1,
                    status="Active"
                )
                db.add(q)
                db.flush()

                cfg = QuestionEvaluationConfig(
                    question_id=q.id,
                    evaluation_type="CodeSandbox",
                    reference_solution=q_data["template"],
                    public_test_cases_json=q_data["public_tests"],
                    hidden_test_cases_json=q_data["hidden_tests"],
                    scoring_rules_json={"language": "c", "pass_threshold": 1.0}
                )
                db.add(cfg)
                db.flush()

        print(f"  -> Seeded {len(r4_questions)} debugging questions for Round 4 (C Debugging)")

        # 5. Allocate Domain 4 to All Active Students
        print("\n[STEP 5] Auto-Allocating Domain 4 to active student profiles...")
        system_user = db.query(User).filter(User.username == "admin").first() or db.query(User).first()
        default_class = db.query(AcademicClass).first()

        activation_req = db.query(AssessmentActivationRequest).filter(
            AssessmentActivationRequest.domain_id == domain.id,
            AssessmentActivationRequest.notes == "CORE_TRACK_ACTIVATION"
        ).first()

        if not activation_req:
            activation_req = AssessmentActivationRequest(
                domain_id=domain.id,
                academic_class_id=default_class.id if default_class else 1,
                requested_by_id=system_user.id if system_user else 1,
                reviewed_by_id=system_user.id if system_user else 1,
                status="APPROVED",
                valid_from=datetime.datetime.utcnow() - datetime.timedelta(days=30),
                valid_until=datetime.datetime.utcnow() + datetime.timedelta(days=365),
                notes="CORE_TRACK_ACTIVATION"
            )
            db.add(activation_req)
            db.flush()

        all_students = db.query(StudentProfile).all()
        alloc_count = 0
        for sp in all_students:
            existing_alloc = db.query(AssessmentStudentAllocation).filter(
                AssessmentStudentAllocation.request_id == activation_req.id,
                AssessmentStudentAllocation.student_id == sp.id
            ).first()

            if not existing_alloc:
                new_alloc = AssessmentStudentAllocation(
                    request_id=activation_req.id,
                    student_id=sp.id,
                    status="APPROVED",
                    source="TUTOR_ACTIVATION",
                    valid_from=datetime.datetime.utcnow() - datetime.timedelta(days=30),
                    valid_until=datetime.datetime.utcnow() + datetime.timedelta(days=365),
                    allocated_at=datetime.datetime.utcnow()
                )
                db.add(new_alloc)
                alloc_count += 1

        db.commit()
        print(f"  + Successfully allocated Domain 4 to {alloc_count} students via Activation Request #{activation_req.id}.")

        print("\n" + "=" * 80)
        print("MIGRATION COMPLETE: DOMAIN 4 (C & SYSTEMS PROGRAMMING) SUCCESSFULLY SEEDED!")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"ERROR during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_c_domain()
