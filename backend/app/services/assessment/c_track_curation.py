"""
Curated difficulty labels for the C & Systems Programming track.

Single source of truth used by the seed scripts and by
app/migrations/fix_c_track_question_bank.py. Labels reflect how hard a question
actually is (for debugging: how subtle the defect is), not its topic.

Easy holds only very basic questions: one step, or fundamentals only (variables,
conditions, loops, arrays, strings). Each level of each round holds at least 10
questions so a single-level attempt is filled from that level alone.

"Expert" coding problems need more than the ~20 minutes a Balanced/Easy/Medium
round allows; question selection only draws them when the tutor picks Hard, and
then at most one per attempt.
"""

# MCQ marks and per-question pacing follow difficulty.
MCQ_MARKS = {"Easy": 1.0, "Medium": 2.0, "Hard": 3.0}
MCQ_TIME_LIMIT_SECONDS = {"Easy": 45, "Medium": 60, "Hard": 90}

# Round 1 (aptitude) and Round 2 (C fundamentals): title -> difficulty
MCQ_DIFFICULTY = {
    1: {
        # Easy: one-step arithmetic or a direct read of the question.
        "Ratio & Proportion Division": "Easy",
        "Percentage Profit Calculation": "Easy",
        "Geometric Progression Series": "Easy",
        "Arithmetic Progression Series": "Easy",  # legacy title of the same question
        "Simple Interest Accrual": "Easy",
        "Arithmetic Mean of Integer Set": "Easy",
        "Dice Roll Probability": "Easy",
        "Family Tree Logical Deduction": "Easy",
        "Categorical Syllogism": "Easy",
        "Iterative Loop Sum Deduction": "Easy",
        "Percentage of a Quantity": "Easy",
        # Medium: two steps or one standard formula.
        "Combined Work Rate": "Medium",
        "Speed, Distance and Time": "Medium",
        "Pattern Coding & Transposition": "Medium",
        "Linear Age Relationship": "Medium",
        "Analog Clock Hand Angle": "Medium",
        "Conditional Discount Flow Deduction": "Medium",
        "Successive Discounts": "Medium",
        "Inlet and Outlet Pipes": "Medium",
        "Square-Based Number Series": "Medium",
        "Linear Seating Arrangement": "Medium",
        # Hard: several dependent steps or a non-obvious setup.
        "Compound vs Simple Interest Difference": "Hard",
        "Mixture Concentration Change": "Hard",
        "Trains Crossing in Opposite Directions": "Hard",
        "Arrangements with Two People Together": "Hard",
        "Probability Without Replacement": "Hard",
        "Work Rate with a Worker Leaving": "Hard",
        "Clock Hands Coinciding": "Hard",
        "Day of the Week Across a Leap Year": "Hard",
        "Two-Step Letter Coding": "Hard",
        "Nested Loop Product Sum": "Hard",
    },
    2: {
        # Easy: single-line syntax or a definition.
        "Pointer Dereference and Modification": "Easy",
        "Array Identifier Decay": "Easy",
        "Double Pointer Indirection": "Easy",
        "Pointer Variable Size": "Easy",
        "Bitwise Left Shift Operator": "Easy",
        "Static Variable Lifetime": "Easy",
        "Structure vs Union Memory Layout": "Easy",
        "malloc Return Value & Type": "Easy",
        "Dangling Pointer Definition": "Easy",
        "Integer Division Result": "Easy",
        # Medium: tracing a few statements or one well-known pitfall.
        "Pointer Arithmetic Stride": "Medium",
        "Macro Parenthesization Hazard": "Medium",
        "String Literal Memory Size": "Medium",
        "Pointer to Const vs Const Pointer": "Medium",
        "Bitwise In-place XOR Swap": "Medium",
        "Function Pointer Declaration": "Medium",
        "Post-Increment in an Expression": "Medium",
        "Loop with continue and break": "Medium",
        "Switch Case Fall-through": "Medium",
        "Logical AND Short-Circuit": "Medium",
        # Hard: operator precedence, type rules, memory layout, or multi-step tracing.
        "Dereference with Post-Increment": "Hard",
        "Pre-Increment Through a Pointer": "Hard",
        "Structure Padding and sizeof": "Hard",
        "Signed vs Unsigned Comparison": "Hard",
        "Pointer to an Array Declaration": "Hard",
        "2D Array Row Pointer Arithmetic": "Hard",
        "sizeof an Array Parameter": "Hard",
        "Recursion with Step of Two": "Hard",
        "Counting Set Bits with x & (x - 1)": "Hard",
        "String Pointer Offsets": "Hard",
    },
}

# Round 3 (coding): question number -> difficulty, where it differs from the seed's level.
CODING_DIFFICULTY_OVERRIDES = {
    43: "Hard",     # Starting node of a cycle (Floyd phase 2)
    46: "Expert",   # Reverse a linked list in groups of K
    49: "Expert",   # Sort a linked list in O(N log N)
    50: "Expert",   # Clone a linked list with random pointers
    60: "Expert",   # LRU cache
    15: "Medium",   # Second-largest without sorting: more than a basic single pass
    16: "Medium",   # Remove duplicates preserving order: nested scan
    55: "Medium",   # Postfix evaluation: one stack pass
    51: "Medium",   # Stack using an array
    52: "Medium",   # Queue using an array
    53: "Medium",   # Circular queue
    57: "Medium",   # Height of a binary tree
    58: "Medium",   # Tree traversals
}

# Round 4 (debugging): question number -> difficulty, where it differs from the seed's level.
# Easy stays within basic programs (no linked lists or trees), whatever the defect.
DEBUG_DIFFICULTY_OVERRIDES = {
    22: "Easy", 24: "Easy", 27: "Easy",
    18: "Medium", 20: "Medium", 51: "Medium", 52: "Medium", 53: "Medium",
    54: "Medium", 55: "Medium", 58: "Medium", 60: "Medium",
    44: "Hard",
}


def number_from_title(title: str):
    """'Q07: ...' or 'D07: ...' -> 7; None otherwise."""
    if title and len(title) > 3 and title[0] in "QD" and title[1:3].isdigit() and title[3] == ":":
        return int(title[1:3])
    return None
