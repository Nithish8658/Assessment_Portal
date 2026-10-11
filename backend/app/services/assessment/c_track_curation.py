"""
Curated difficulty labels for the C & Systems Programming track.

Single source of truth used by the seed scripts and by
app/migrations/fix_c_track_question_bank.py. Labels reflect how hard a question
actually is (for debugging: how subtle the defect is), not its topic.

"Expert" coding problems need more than the ~20 minutes a Balanced/Easy/Medium
round allows; question selection only draws them when the tutor picks Hard.
"""

# MCQ marks and per-question pacing follow difficulty.
MCQ_MARKS = {"Easy": 1.0, "Medium": 2.0, "Hard": 3.0}
MCQ_TIME_LIMIT_SECONDS = {"Easy": 45, "Medium": 60, "Hard": 90}

# Round 1 (aptitude) and Round 2 (C fundamentals): title -> difficulty
MCQ_DIFFICULTY = {
    1: {
        "Ratio & Proportion Division": "Easy",
        "Percentage Profit Calculation": "Easy",
        "Geometric Progression Series": "Easy",
        "Arithmetic Progression Series": "Easy",  # legacy title of the same question
        "Combined Work Rate": "Medium",
        "Speed, Distance and Time": "Medium",
        "Simple Interest Accrual": "Easy",
        "Arithmetic Mean of Integer Set": "Easy",
        "Dice Roll Probability": "Medium",
        "Pattern Coding & Transposition": "Medium",
        "Family Tree Logical Deduction": "Medium",
        "Categorical Syllogism": "Easy",
        "Linear Age Relationship": "Medium",
        "Analog Clock Hand Angle": "Hard",
        "Iterative Loop Sum Deduction": "Easy",
        "Conditional Discount Flow Deduction": "Medium",
    },
    2: {
        "Pointer Dereference and Modification": "Easy",
        "Pointer Arithmetic Stride": "Medium",
        "Array Identifier Decay": "Easy",
        "Double Pointer Indirection": "Medium",
        "Pointer Variable Size": "Easy",
        "Bitwise Left Shift Operator": "Easy",
        "Macro Parenthesization Hazard": "Hard",
        "Static Variable Lifetime": "Medium",
        "String Literal Memory Size": "Medium",
        "Structure vs Union Memory Layout": "Easy",
        "malloc Return Value & Type": "Easy",
        "Dangling Pointer Definition": "Easy",
        "Pointer to Const vs Const Pointer": "Medium",
        "Bitwise In-place XOR Swap": "Medium",
        "Function Pointer Declaration": "Medium",
    },
}

# Round 3 (coding): question number -> difficulty, where it differs from the seed's level.
CODING_DIFFICULTY_OVERRIDES = {
    43: "Hard",     # Starting node of a cycle (Floyd phase 2)
    46: "Expert",   # Reverse a linked list in groups of K
    49: "Expert",   # Sort a linked list in O(N log N)
    50: "Expert",   # Clone a linked list with random pointers
    60: "Expert",   # LRU cache
    51: "Medium",   # Stack using an array
    52: "Medium",   # Queue using an array
    53: "Medium",   # Circular queue
    57: "Medium",   # Height of a binary tree
    58: "Medium",   # Tree traversals
}

# Round 4 (debugging): question number -> difficulty, where it differs from the seed's level.
DEBUG_DIFFICULTY_OVERRIDES = {
    22: "Easy", 24: "Easy", 27: "Easy", 37: "Easy", 54: "Easy",
    18: "Medium", 20: "Medium", 51: "Medium", 52: "Medium", 53: "Medium",
    55: "Medium", 58: "Medium", 60: "Medium",
    44: "Hard",
}


def number_from_title(title: str):
    """'Q07: ...' or 'D07: ...' -> 7; None otherwise."""
    if title and len(title) > 3 and title[0] in "QD" and title[1:3].isdigit() and title[3] == ":":
        return int(title[1:3])
    return None
