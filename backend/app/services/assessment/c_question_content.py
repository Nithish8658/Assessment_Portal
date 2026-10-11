"""
Helpers that keep C-track question content safe to show candidates.

- make_c_starter_template(): turns a reference solution into a starter skeleton.
  Includes, type definitions, and global state are kept; every function body
  (including main) is replaced with a TODO stub, so no solution logic leaks.
- unescape_text(): converts literal "\\n" sequences in authored prose into real newlines.
- strip_debug_hint(): removes the "Debug Hint:" section from a debugging prompt.
"""

import re

_FUNC_HEADER = re.compile(
    r"^(?P<ret>[A-Za-z_][\w \t\*]*?[\s\*])(?P<name>[A-Za-z_]\w*)\s*\((?P<params>[^;{}()]*)\)\s*\{",
    re.M,
)
_NOT_FUNCTIONS = {"if", "for", "while", "switch", "return", "sizeof", "else"}


def _default_return(ret_type: str) -> str:
    rt = " ".join(ret_type.replace("static", "").replace("inline", "").split())
    if rt == "void":
        return ""
    if "*" in rt:
        return "    return NULL;\n"
    if rt in {"float", "double", "long double"}:
        return "    return 0.0;\n"
    return "    return 0;\n"


def _matching_brace(src: str, open_idx: int) -> int:
    depth = 0
    i = open_idx
    in_str = in_chr = in_line = in_block = False
    while i < len(src):
        ch = src[i]
        nxt = src[i + 1] if i + 1 < len(src) else ""
        if in_line:
            in_line = ch != "\n"
        elif in_block:
            if ch == "*" and nxt == "/":
                in_block = False
                i += 1
        elif in_str:
            if ch == "\\":
                i += 1
            elif ch == '"':
                in_str = False
        elif in_chr:
            if ch == "\\":
                i += 1
            elif ch == "'":
                in_chr = False
        elif ch == "/" and nxt == "/":
            in_line = True
        elif ch == "/" and nxt == "*":
            in_block = True
            i += 1
        elif ch == '"':
            in_str = True
        elif ch == "'":
            in_chr = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError("Unbalanced braces in C source")


def make_c_starter_template(solution: str) -> str:
    """Return a skeleton of `solution` with every function body replaced by a TODO stub."""
    if not solution or not solution.strip():
        return "#include <stdio.h>\n\nint main() {\n    // TODO: read input, solve the problem, and print the result\n    return 0;\n}\n"

    out = []
    pos = 0
    for m in _FUNC_HEADER.finditer(solution):
        if m.start() < pos or m.group("name") in _NOT_FUNCTIONS:
            continue
        open_idx = m.end() - 1
        close_idx = _matching_brace(solution, open_idx)
        name = m.group("name")
        header = solution[m.start():open_idx].rstrip()
        out.append(solution[pos:m.start()])
        if name == "main":
            body = (
                "    // TODO: read the input from stdin exactly as described,\n"
                "    // solve the problem, and print the result to stdout.\n"
                "    return 0;\n"
            )
        else:
            body = "    // TODO: implement\n" + _default_return(m.group("ret"))
        out.append(f"{header} {{\n{body}}}")
        pos = close_idx + 1
    out.append(solution[pos:])
    skeleton = "".join(out)
    skeleton = re.sub(r"\n{3,}", "\n\n", skeleton).strip() + "\n"
    return skeleton


def unescape_text(value):
    """Convert literal backslash-n sequences in authored prose/test data into newlines."""
    if isinstance(value, str):
        return value.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\t", "\t")
    if isinstance(value, list):
        return [unescape_text(v) for v in value]
    if isinstance(value, dict):
        return {k: unescape_text(v) for k, v in value.items()}
    return value


def strip_debug_hint(content: str) -> str:
    """Remove a trailing 'Debug Hint:' section so the hint is not shown up front."""
    if not content:
        return content
    return re.split(r"\n*\s*Debug Hint:\s*", content, maxsplit=1)[0].rstrip()
