#!/usr/bin/env python3
"""
audit_static.py: heuristic static scanner for UI/UX and accessibility defects.

Scans HTML, CSS and component files (JSX, TSX, Vue, Svelte, Astro) for patterns
that commonly cause accessibility, usability, performance and consistency
problems, and reports a "symmetry report" of design-token drift (how many
distinct colors, font sizes, radii and z-index values the code actually uses).

Standard library only. Findings are CANDIDATES. A static scan cannot see
rendered contrast, focus order, real screen reader output or performance, so
confirm each finding before reporting it as a defect, and never treat a clean
scan as a pass.

Usage:
  python audit_static.py PATH [PATH ...] [--format md|json] [--max-examples 5]
                         [--fail-on S0|S1|S2|S3] [--min-confidence low|medium|high]
  cat page.html | python audit_static.py - 

Severity (suggested, assign final severity by user impact):
  S0 blocker, S1 major, S2 minor, S3 polish
"""

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser

SKIP_DIRS = {
    "node_modules", ".git", ".next", "dist", "build", "out", ".venv", "venv",
    "__pycache__", "vendor", "coverage", ".turbo", ".vercel", ".cache", ".svelte-kit",
}
HTML_EXT = {".html", ".htm"}
CSS_EXT = {".css", ".scss", ".sass", ".less"}
COMPONENT_EXT = {".jsx", ".tsx", ".vue", ".svelte", ".astro"}

SEV_ORDER = {"S0": 0, "S1": 1, "S2": 2, "S3": 3}
CONF_ORDER = {"low": 0, "medium": 1, "high": 2}

VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
    "param", "source", "track", "wbr",
}
DEPRECATED_TAGS = {"font", "center", "marquee", "blink", "frame", "frameset", "big", "strike", "tt"}
GENERIC_LINK_TEXT = {
    "click here", "here", "read more", "more", "learn more", "link", "this link",
    "click", "details", "see more",
}
NON_INTERACTIVE = {"div", "span", "li", "p", "section", "article", "td", "tr", "img", "h1", "h2", "h3", "h4", "h5", "h6"}


class Finding:
    __slots__ = ("rule", "severity", "confidence", "file", "line", "message", "fix")

    def __init__(self, rule, severity, confidence, file, line, message, fix):
        self.rule = rule
        self.severity = severity
        self.confidence = confidence
        self.file = file
        self.line = line
        self.message = message
        self.fix = fix

    def as_dict(self):
        return {s: getattr(self, s) for s in self.__slots__}


class Collector:
    """Holds findings plus project-level counters used for aggregate checks."""

    def __init__(self):
        self.findings = []
        self.files_scanned = Counter()
        self.colors = Counter()
        self.token_colors = Counter()
        self.font_sizes = Counter()
        self.radii = Counter()
        self.z_indexes = Counter()
        self.font_weights = Counter()
        self.important = 0
        self.uses_motion = False
        self.has_reduced_motion = False
        self.hover_rules = 0
        self.focus_rules = 0
        self.has_color_scheme = False

    def add(self, rule, severity, confidence, file, line, message, fix):
        self.findings.append(Finding(rule, severity, confidence, file, line, message, fix))


# ---------------------------------------------------------------- helpers

def line_of(text, offset):
    return text.count("\n", 0, offset) + 1


def attr_dict(attrs):
    d = {}
    for k, v in attrs:
        d[k.lower()] = "" if v is None else v
    return d


def norm_hex(h):
    h = h.lower()
    if len(h) == 4:  # #rgb
        h = "#" + "".join(c * 2 for c in h[1:])
    if len(h) == 5:  # #rgba
        h = "#" + "".join(c * 2 for c in h[1:])
    return h


# ---------------------------------------------------------------- CSS

COLOR_RE = re.compile(
    r"#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)"
)


def scan_css(text, path, col, line_offset=0):
    """Scan CSS text. line_offset is added to computed line numbers (for <style> blocks)."""
    clean = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)

    if re.search(r"prefers-reduced-motion", clean):
        col.has_reduced_motion = True
    if re.search(r"(?<![-\w])(animation|transition)\s*:|@keyframes", clean):
        col.uses_motion = True
    if re.search(r"prefers-color-scheme|color-scheme\s*:|light-dark\(", clean):
        col.has_color_scheme = True
    col.important += len(re.findall(r"!important", clean))
    col.hover_rules += len(re.findall(r":hover\b", clean))
    col.focus_rules += len(re.findall(r":focus(-visible|-within)?\b", clean))

    # --- outline removal
    outline_hits = []
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", clean):
        sel, body = m.group(1).strip(), m.group(2)
        if re.search(r"(?<![-\w])outline\s*:\s*(none|0)\b", body) or re.search(
            r"outline-style\s*:\s*none", body
        ):
            if ":not(:focus-visible)" in sel or ":not(.focus-visible)" in sel:
                continue
            if re.search(r"box-shadow\s*:\s*(?!none)", body) or re.search(r"border(-color)?\s*:", body):
                continue  # replaced in the same rule
            outline_hits.append((m.start(), sel))
    if outline_hits:
        has_replacement = bool(
            re.search(r":focus-visible[^{]*\{[^}]*(outline\s*:\s*(?!none|0)|box-shadow\s*:\s*(?!none)|border)", clean)
            or re.search(r":focus[^{]*\{[^}]*(outline\s*:\s*(?!none|0)|box-shadow\s*:\s*(?!none))", clean)
        )
        for off, sel in outline_hits[:20]:
            col.add(
                "focus-outline-removed",
                "S2" if has_replacement else "S1",
                "low" if has_replacement else "medium",
                path,
                line_of(clean, off) + line_offset,
                f"outline removed on `{sel[:60]}`" + (
                    "; a focus replacement exists elsewhere, confirm it covers the same elements"
                    if has_replacement else " and no focus replacement found in this file"
                ),
                "Keep a visible focus indicator (3:1 contrast). Use `:focus-visible { outline: 2px solid; outline-offset: 2px }` and only remove outline for `:focus:not(:focus-visible)`.",
            )

    # --- declarations
    for m in re.finditer(r"([-\w]+)\s*:\s*([^;{}]+)(?=;|\})", clean):
        prop, val = m.group(1).lower(), m.group(2).strip()
        ln = line_of(clean, m.start()) + line_offset
        if prop.startswith("--"):
            for c in COLOR_RE.findall(val):
                col.token_colors[norm_hex(c) if c.startswith("#") else c.lower().replace(" ", "")] += 1
            continue
        if prop in ("color", "background", "background-color", "border", "border-color", "fill", "stroke",
                    "outline", "outline-color", "box-shadow", "text-shadow", "border-top-color",
                    "border-bottom-color", "border-left-color", "border-right-color"):
            for c in COLOR_RE.findall(val):
                col.colors[norm_hex(c) if c.startswith("#") else c.lower().replace(" ", "")] += 1
        if prop == "font-size":
            col.font_sizes[val.lower()] += 1
            px = re.fullmatch(r"([\d.]+)px", val.lower())
            if px and float(px.group(1)) < 12:
                col.add("tiny-font", "S2", "medium", path, ln,
                        f"font-size {val} is below 12px",
                        "Use at least 12px for supporting text and 16px for body; prefer rem so user text size applies.")
        elif prop == "font-weight":
            col.font_weights[val.lower()] += 1
        elif prop == "border-radius":
            col.radii[val.lower()] += 1
        elif prop == "z-index":
            col.z_indexes[val.lower()] += 1
        elif prop == "transition" and re.match(r"all\b", val.lower()):
            col.add("transition-all", "S3", "high", path, ln,
                    "`transition: all` animates every property, including layout ones",
                    "List the properties you mean (e.g. `transition: opacity .2s, transform .2s`).")
        elif prop == "user-select" and val.lower() == "none":
            col.add("user-select-none", "S3", "low", path, ln,
                    "`user-select: none` found; confirm it is not applied to readable content",
                    "Limit it to controls and drag handles. Users need to select and copy text.")
        elif prop == "height" and re.search(r"\b100vh\b", val):
            col.add("100vh", "S3", "medium", path, ln,
                    "`100vh` can clip content under mobile browser chrome",
                    "Use `100dvh` (or `svh`/`lvh`) with a `vh` fallback.")
        elif prop == "min-height" and re.search(r"\b100vh\b", val):
            col.add("100vh", "S3", "medium", path, ln,
                    "`100vh` can clip content under mobile browser chrome",
                    "Use `100dvh` (or `svh`/`lvh`) with a `vh` fallback.")
        elif prop == "width":
            px = re.fullmatch(r"(\d+)px", val.lower())
            if px and int(px.group(1)) >= 520:
                col.add("fixed-width", "S2", "low", path, ln,
                        f"fixed `width: {val}` may break reflow on narrow screens",
                        "Use `max-width` with `width: 100%`, or fluid units. Check at 320px and 400% zoom.")


# ---------------------------------------------------------------- HTML

class HTMLAudit(HTMLParser):
    def __init__(self, path, col):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.col = col
        self.saw_html = False
        self.lang = None
        self.has_title = False
        self.has_viewport = False
        self.has_main = False
        self.in_head = False
        self.in_svg = 0
        self.in_title = False
        self.in_style = False
        self.style_line = 0
        self.style_buf = []
        self.in_script = False
        self.h_levels = []
        self.h1_count = 0
        self.ids = Counter()
        self.label_for = set()
        self.label_depth = 0
        self.inputs = []          # (line, attrs, inside_label)
        self.collectors = []      # open a/button name collectors
        self.table_stack = []
        self.cur_heading = None

    def _add(self, *a):
        self.col.add(*a)

    def handle_starttag(self, tag, attrs):
        a = attr_dict(attrs)
        line = self.getpos()[0]
        tag = tag.lower()

        if tag == "html":
            self.saw_html = True
            self.lang = a.get("lang")
        elif tag == "head":
            self.in_head = True
        elif tag == "svg":
            self.in_svg += 1
        elif tag == "title" and not self.in_svg:
            self.in_title = True
            self.has_title = True
        elif tag == "style":
            self.in_style = True
            self.style_line = line
            self.style_buf = []
        elif tag == "script":
            self.in_script = True
            if self.in_head and "src" in a and "async" not in a and "defer" not in a and a.get("type", "") != "module":
                self._add("render-blocking-script", "S2", "medium", self.path, line,
                          "synchronous external script in <head> blocks rendering",
                          "Add `defer` (or `type=module`/`async`), or move it to the end of <body>.")
        elif tag == "meta":
            name = a.get("name", "").lower()
            if name == "viewport":
                self.has_viewport = True
                content = a.get("content", "").lower().replace(" ", "")
                if "user-scalable=no" in content or re.search(r"maximum-scale=(1(\.0)?|0?\.\d+)(,|$)", content):
                    self._add("zoom-disabled", "S1", "high", self.path, line,
                              "viewport meta blocks pinch zoom",
                              "Remove `user-scalable=no` and `maximum-scale=1`; WCAG 1.4.4 requires zoom to 200%.")
            if a.get("http-equiv", "").lower() == "refresh":
                self._add("meta-refresh", "S2", "medium", self.path, line,
                          "meta refresh redirects or reloads without user control",
                          "Use a server redirect, or give users control over timing (WCAG 2.2.1, 3.2.5).")
        elif tag in ("main",) or a.get("role") == "main":
            self.has_main = True

        if tag in DEPRECATED_TAGS:
            self._add("deprecated-tag", "S3", "high", self.path, line,
                      f"deprecated presentational tag <{tag}>",
                      "Replace with semantic HTML and CSS.")

        if a.get("id"):
            self.ids[a["id"]] += 1
            if self.ids[a["id"]] == 2:
                self._add("duplicate-id", "S2", "high", self.path, line,
                          f"duplicate id `{a['id']}` (breaks label and ARIA references)",
                          "Make ids unique.")

        if "tabindex" in a:
            try:
                if int(a["tabindex"]) > 0:
                    self._add("positive-tabindex", "S2", "high", self.path, line,
                              f"tabindex={a['tabindex']} overrides natural focus order",
                              "Use tabindex 0 or -1 and fix DOM order instead.")
            except ValueError:
                pass

        if "style" in a and re.search(r"outline\s*:\s*(none|0)\b", a["style"]):
            self._add("focus-outline-removed", "S1", "medium", self.path, line,
                      "inline style removes the focus outline",
                      "Keep a visible focus indicator.")

        if any(k in a for k in ("onclick",)) and tag in NON_INTERACTIVE and "role" not in a:
            self._add("click-on-noninteractive", "S1", "medium", self.path, line,
                      f"click handler on <{tag}> with no role, tabindex or key handler",
                      "Use a real <button> or <a>. If you must keep the element, add role, tabindex=0 and Enter/Space handling.")

        if tag in ("video", "audio") and "autoplay" in a:
            self._add("autoplay-media", "S2", "high", self.path, line,
                      f"<{tag}> autoplays",
                      "Do not autoplay with sound. Provide pause controls, honor reduced motion, avoid on constrained networks.")

        if a.get("target") == "_blank" and "noopener" not in a.get("rel", "") and "noreferrer" not in a.get("rel", ""):
            self._add("blank-no-rel", "S3", "medium", self.path, line,
                      "target=_blank without rel=noopener",
                      "Add `rel=\"noopener\"` (modern browsers imply it, but be explicit) and tell users it opens a new tab where it matters.")

        if tag == "img":
            self._check_img(a, line)
            for c in self.collectors:
                c["has_name"] = c["has_name"] or bool(a.get("alt", "").strip())
        elif tag == "iframe" and not (a.get("title") or a.get("aria-label")):
            self._add("iframe-title", "S2", "high", self.path, line,
                      "<iframe> has no title",
                      "Add a descriptive `title` attribute.")
        elif tag == "label":
            self.label_depth += 1
            if "for" in a:
                self.label_for.add(a["for"])
        elif tag in ("input", "select", "textarea"):
            t = a.get("type", "text").lower()
            if tag == "input" and t in ("hidden", "submit", "button", "reset", "image"):
                pass
            else:
                self.inputs.append((line, a, tag, self.label_depth > 0))
        elif tag in ("a", "button"):
            self.collectors.append({
                "tag": tag, "line": line, "attrs": a, "text": [],
                "has_name": bool(a.get("aria-label") or a.get("aria-labelledby") or a.get("title")),
            })
            href = a.get("href")
            if tag == "a" and href is not None and (href in ("#", "") or href.lower().startswith("javascript:")):
                self._add("dead-link", "S2", "medium", self.path, line,
                          "link with `#` or `javascript:` href used as a button",
                          "Use a <button> for actions; keep <a href> for navigation.")
        elif re.fullmatch(r"h[1-6]", tag):
            lvl = int(tag[1])
            self.h_levels.append((lvl, line))
            if lvl == 1:
                self.h1_count += 1
        elif tag == "table":
            self.table_stack.append({"line": line, "th": False, "role": a.get("role", "")})
        elif tag == "th" and self.table_stack:
            self.table_stack[-1]["th"] = True

        # any element with aria-label counts as a name for open a/button
        if a.get("aria-label") and self.collectors and tag not in ("a", "button"):
            self.collectors[-1]["has_name"] = True

        # Tailwind / class based checks handled on raw text elsewhere

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag.lower() not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "head":
            self.in_head = False
        elif tag == "svg":
            self.in_svg = max(0, self.in_svg - 1)
        elif tag == "title" and not self.in_svg:
            self.in_title = False
        elif tag == "style":
            self.in_style = False
            scan_css("".join(self.style_buf), self.path, self.col, line_offset=self.style_line - 1)
        elif tag == "script":
            self.in_script = False
        elif tag == "label":
            self.label_depth = max(0, self.label_depth - 1)
        elif tag in ("a", "button") and self.collectors:
            c = self.collectors.pop()
            text = " ".join("".join(c["text"]).split())
            if not text and not c["has_name"]:
                sev = "S1"
                self._add("no-accessible-name", sev, "high", self.path, c["line"],
                          f"<{c['tag']}> has no text, aria-label or labelled image",
                          "Add visible text, or `aria-label` for icon-only controls.")
            elif c["tag"] == "a" and text.lower().strip(" .!") in GENERIC_LINK_TEXT:
                self._add("generic-link-text", "S2", "medium", self.path, c["line"],
                          f"link text \"{text}\" does not make sense out of context",
                          "Name the destination or outcome (\"Read the refund policy\").")
        elif tag == "table" and self.table_stack:
            t = self.table_stack.pop()
            if not t["th"] and t["role"] not in ("presentation", "none"):
                self._add("table-no-headers", "S2", "low", self.path, t["line"],
                          "<table> has no <th>; layout table or missing header cells",
                          "Use <th scope> for data tables. For layout, use CSS Grid or Flexbox.")

    def handle_data(self, data):
        if self.in_style:
            self.style_buf.append(data)
            return
        if self.in_script:
            return
        for c in self.collectors:
            c["text"].append(data)

    def _check_img(self, a, line):
        if "alt" not in a:
            self._add("img-no-alt", "S1", "high", self.path, line,
                      "<img> has no alt attribute",
                      "Add meaningful alt text, or `alt=\"\"` if purely decorative.")
        else:
            alt = a["alt"].strip()
            if re.search(r"\.(png|jpe?g|gif|webp|svg|avif)$", alt, re.I) or alt.lower() in ("image", "photo", "picture", "img"):
                self._add("img-bad-alt", "S2", "high", self.path, line,
                          f"alt text \"{alt}\" is a filename or placeholder",
                          "Describe the purpose of the image in context.")
        if not (("width" in a and "height" in a) or "aspect-ratio" in a.get("style", "")):
            self._add("img-no-dimensions", "S2", "medium", self.path, line,
                      "<img> without width and height can cause layout shift (CLS)",
                      "Set `width` and `height` attributes (or CSS `aspect-ratio`).")

    def finish(self):
        # document-level checks only if this looks like a full page
        if self.saw_html:
            if not self.lang:
                self._add("no-lang", "S1", "high", self.path, 1,
                          "<html> has no lang attribute",
                          "Add `lang` (e.g. `<html lang=\"en\">`) so screen readers pick the right voice (WCAG 3.1.1).")
            if not self.has_title:
                self._add("no-title", "S1", "high", self.path, 1,
                          "page has no <title>",
                          "Add a unique, descriptive title (WCAG 2.4.2).")
            if not self.has_viewport:
                self._add("no-viewport", "S1", "high", self.path, 1,
                          "no viewport meta tag; mobile browsers will render a desktop-width page",
                          "Add `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`.")
            if not self.has_main:
                self._add("no-main", "S2", "medium", self.path, 1,
                          "no <main> landmark",
                          "Wrap primary content in <main> and add a skip link.")
            if self.h1_count == 0:
                self._add("no-h1", "S2", "medium", self.path, 1,
                          "no <h1> on the page", "Give the page one clear <h1>.")
        if self.h1_count > 1:
            self._add("multiple-h1", "S3", "low", self.path, 1,
                      f"{self.h1_count} <h1> elements", "Prefer one <h1> per page; confirm sections are structured intentionally.")
        prev = 0
        for lvl, ln in self.h_levels:
            if prev and lvl > prev + 1:
                self._add("heading-skip", "S2", "high", self.path, ln,
                          f"heading level jumps from h{prev} to h{lvl}",
                          "Do not skip levels; style with CSS instead of picking a heading for size.")
            prev = lvl
        for line, a, tag, in_label in self.inputs:
            labelled = (
                in_label
                or a.get("id") in self.label_for and a.get("id")
                or a.get("aria-label")
                or a.get("aria-labelledby")
                or a.get("title")
            )
            if not labelled:
                if a.get("placeholder"):
                    self._add("placeholder-as-label", "S1", "high", self.path, line,
                              f"<{tag}> relies on placeholder as its only label",
                              "Add a visible <label for=...>. Placeholders disappear on typing and have weak contrast.")
                else:
                    self._add("input-no-label", "S1", "high", self.path, line,
                              f"<{tag}> has no associated label",
                              "Add <label for=id>, wrap the control in a label, or use aria-label/aria-labelledby.")
            t = a.get("type", "text").lower()
            nm = (a.get("name", "") + " " + a.get("id", "")).lower()
            if tag == "input" and "autocomplete" not in a and (
                t in ("email", "tel") or re.search(r"(e-?mail|phone|tel|first.?name|last.?name|full.?name|address|postal|zip)", nm)
            ):
                self._add("no-autocomplete", "S2", "low", self.path, line,
                          "personal-data field without `autocomplete` (WCAG 1.3.5)",
                          "Add the matching token (`email`, `tel`, `given-name`, `street-address`, ...).")


def scan_html(text, path, col):
    p = HTMLAudit(path, col)
    try:
        p.feed(text)
        p.close()
    except Exception as exc:  # malformed markup should not abort the scan
        col.add("parse-error", "S3", "low", path, 1, f"HTML parse problem: {exc}", "Validate the markup.")
    p.finish()
    scan_tailwind(text, path, col)
    if re.search(r"user-scalable\s*=\s*no", text, re.I) and not any(
        f.rule == "zoom-disabled" and f.file == path for f in col.findings
    ):
        col.add("zoom-disabled", "S1", "medium", path, 1, "pinch zoom disabled", "Remove `user-scalable=no`.")


# ---------------------------------------------------------------- Tailwind / class strings

TW_LOW_CONTRAST = re.compile(r"\btext-(gray|slate|zinc|neutral|stone)-(300|400)\b")
TW_OUTLINE_NONE = re.compile(r"\b(?:focus:|focus-visible:)?outline-none\b")


def scan_tailwind(text, path, col):
    if re.search(r"\banimate-|framer-motion|<motion\.|@keyframes", text):
        col.uses_motion = True
    if re.search(r"motion-reduce:|motion-safe:|prefers-reduced-motion|useReducedMotion", text):
        col.has_reduced_motion = True
    if re.search(r"\bhover:", text):
        col.hover_rules += 1
    if re.search(r"focus(-visible|-within)?:(?!outline-none)", text) or re.search(r":focus(-visible)?\b", text):
        col.focus_rules += 1
    if re.search(r"\bdark:|prefers-color-scheme|color-scheme", text):
        col.has_color_scheme = True
    seen = 0
    for m in TW_LOW_CONTRAST.finditer(text):
        seen += 1
        if seen <= 25:
            col.add("tailwind-low-contrast", "S2", "low", path, line_of(text, m.start()),
                    f"`{m.group(0)}` often fails 4.5:1 on white or tinted backgrounds",
                    "Measure the actual pair; prefer gray-600 or darker for body text on light backgrounds.")
    for m in re.finditer(r"<[^<>]*?\boutline-none\b[^<>]*>", text, re.S):
        tag = m.group(0)
        if not re.search(r"(focus-visible|focus):(ring|outline(?!-none)|border|shadow)|\bring-", tag):
            col.add("tailwind-outline-none", "S1", "medium", path, line_of(text, m.start()),
                    "`outline-none` without a replacement focus style in the same tag",
                    "Add `focus-visible:ring-2 focus-visible:ring-offset-2` (or an outline) so keyboard focus is visible.")


# ---------------------------------------------------------------- components (JSX/TSX/Vue/Svelte/Astro)

def tag_has(tag_src, *names):
    return any(re.search(r"(?<![\w-])" + n + r"(?=[\s=/>{])", tag_src) for n in names)


def scan_component(text, path, col):
    # <img> without alt (skip when props are spread)
    for m in re.finditer(r"<(img|Image)\b[^<>]*?(?:/>|>)", text, re.S):
        src = m.group(0)
        if "{...}" in src or re.search(r"\{\s*\.\.\.", src):
            continue
        if not tag_has(src, "alt"):
            col.add("img-no-alt", "S1", "high", path, line_of(text, m.start()),
                    f"<{m.group(1)}> without alt",
                    "Add meaningful alt, or `alt=\"\"` if decorative.")

    # click handlers on non-interactive elements
    for m in re.finditer(r"<(div|span|li|p|section|article|td|tr)\b([^<>]*?(?:\bonClick|@click|on:click|\bonclick)\b[^<>]*)>", text, re.S):
        attrs = m.group(2)
        if not tag_has(attrs, "role") and not tag_has(attrs, "onKeyDown", "onKeyUp", "onKeyPress", "@keydown", "on:keydown", "tabIndex", "tabindex"):
            col.add("click-on-noninteractive", "S1", "medium", path, line_of(text, m.start()),
                    f"click handler on <{m.group(1)}> with no role, tabIndex or key handler",
                    "Use <button> or <a>/<Link>. Otherwise add role, tabIndex=0 and Enter/Space handling.")

    # hover-only handlers
    for m in re.finditer(r"<\w+\b[^<>]*?\b(onMouseEnter|onMouseOver|@mouseenter|on:mouseenter)\b[^<>]*>", text, re.S):
        if not re.search(r"onFocus|@focus|on:focus", m.group(0)):
            col.add("hover-only", "S2", "low", path, line_of(text, m.start()),
                    "hover handler without a focus equivalent",
                    "Mirror hover behavior on focus and provide a tap path on touch.")

    # positive tabindex
    for m in re.finditer(r"tab[Ii]ndex\s*=\s*\{?\s*[\"']?(\d+)", text):
        if int(m.group(1)) > 0:
            col.add("positive-tabindex", "S2", "high", path, line_of(text, m.start()),
                    f"tabIndex={m.group(1)} overrides natural focus order",
                    "Use 0 or -1 and fix DOM order.")

    # dead links
    for m in re.finditer(r"<(a|Link)\b[^<>]*\bhref\s*=\s*[\"'](#|javascript:[^\"']*)[\"']", text):
        col.add("dead-link", "S2", "medium", path, line_of(text, m.start()),
                "link with `#` or `javascript:` href used as a button",
                "Use <button> for actions.")

    # target=_blank without rel
    for m in re.finditer(r"<(a|Link)\b[^<>]*target\s*=\s*[\"']_blank[\"'][^<>]*>", text, re.S):
        if "rel=" not in m.group(0):
            col.add("blank-no-rel", "S3", "medium", path, line_of(text, m.start()),
                    "target=_blank without rel", "Add rel=\"noopener noreferrer\".")

    # icon-only buttons with no accessible name
    for m in re.finditer(r"<button\b([^<>]*)>(.*?)</button>", text, re.S):
        attrs, inner = m.group(1), m.group(2)
        if tag_has(attrs, "aria-label", "aria-labelledby", "title"):
            continue
        if re.search(r"sr-only|visually-hidden|aria-label", inner):
            continue
        if not re.search(r"<(svg|img|i)\b|<[A-Z]\w*(Icon|Svg)\b|<Icon\b", inner):
            continue
        if re.search(r"<img\b[^>]*\balt\s*=\s*[\"'][^\"']+", inner):
            continue
        visible = re.sub(r"<[^<>]*>", "", inner).strip()
        if not visible:
            col.add("no-accessible-name", "S1", "medium", path, line_of(text, m.start()),
                    "icon-only <button> with no aria-label or hidden text",
                    "Add `aria-label=\"Close\"` (or similar) and mark the icon `aria-hidden=\"true\"`.")

    # inputs without an obvious label
    for m in re.finditer(r"<(input|textarea|select|Input|Textarea|Select)\b([^<>]*?)/?>", text, re.S):
        attrs = m.group(2)
        t = re.search(r"type\s*=\s*[\"'{]+(\w+)", attrs)
        if t and t.group(1).lower() in ("hidden", "submit", "button", "reset", "image", "checkbox", "radio"):
            continue
        if re.search(r"\{\s*\.\.\.", attrs):
            continue
        if tag_has(attrs, "aria-label", "aria-labelledby", "title", "id", "htmlFor"):
            continue
        before = text[max(0, m.start() - 300):m.start()]
        if before.rfind("<label") > before.rfind("</label"):
            continue
        col.add("input-no-label", "S1", "low", path, line_of(text, m.start()),
                "form control with no id, aria-label or wrapping <label>",
                "Associate a visible label (htmlFor/id, wrapping label, or aria-label).")

    # inline outline none in style objects
    for m in re.finditer(r"outline\s*:\s*[\"']?(none|0)\b", text):
        col.add("focus-outline-removed", "S1", "low", path, line_of(text, m.start()),
                "outline removed in inline style or CSS-in-JS",
                "Keep a visible focus indicator.")

    # autoplay
    for m in re.finditer(r"<(video|audio)\b[^<>]*\b(autoPlay|autoplay)\b", text):
        col.add("autoplay-media", "S2", "high", path, line_of(text, m.start()),
                "media autoplays", "Remove autoplay or provide pause, mute and reduced-motion handling.")

    for m in re.finditer(r"<(marquee|blink|center|font)\b", text):
        col.add("deprecated-tag", "S3", "high", path, line_of(text, m.start()),
                f"deprecated tag <{m.group(1)}>", "Use semantic HTML and CSS.")

    # style blocks inside Vue/Svelte/Astro files
    for m in re.finditer(r"<style\b[^>]*>(.*?)</style>", text, re.S):
        scan_css(m.group(1), path, col, line_offset=line_of(text, m.start(1)) - 1)

    scan_tailwind(text, path, col)


# ---------------------------------------------------------------- driver

def iter_files(paths):
    for p in paths:
        if p == "-":
            yield "-"
            continue
        if os.path.isfile(p):
            yield p
            continue
        for root, dirs, files in os.walk(p):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for f in sorted(files):
                ext = os.path.splitext(f)[1].lower()
                if ext in HTML_EXT | CSS_EXT | COMPONENT_EXT:
                    yield os.path.join(root, f)


def read(path):
    if path == "-":
        return sys.stdin.read()
    with open(path, "r", encoding="utf-8", errors="replace") as fh:
        return fh.read()


def aggregate_checks(col, any_css_or_motion):
    if col.uses_motion and not col.has_reduced_motion:
        col.add("no-reduced-motion", "S2", "medium", "(project)", 0,
                "animations or transitions found but no `prefers-reduced-motion` handling anywhere",
                "Wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)` or disable under `reduce`; use Tailwind `motion-safe:`.")
    if col.hover_rules and not col.focus_rules:
        col.add("hover-without-focus", "S1", "medium", "(project)", 0,
                f"{col.hover_rules} hover style(s) found and no focus styles at all",
                "Give every interactive element a visible `:focus-visible` state.")
    if col.colors and sum(col.colors.values()) > 0 and not col.has_color_scheme:
        col.add("no-color-scheme", "S3", "low", "(project)", 0,
                "no dark mode, `color-scheme` or `light-dark()` handling detected",
                "Decide on theme support deliberately; if added, redesign semantic tokens and re-check contrast in both themes.")


def symmetry_report(col):
    def top(counter, n=5):
        return [f"{k} ({v})" for k, v in counter.most_common(n)]
    all_colors = col.colors + col.token_colors
    return {
        "distinct_colors_in_declarations": len(col.colors),
        "distinct_colors_defined_as_tokens": len(col.token_colors),
        "distinct_colors_total": len(all_colors),
        "distinct_font_sizes": len(col.font_sizes),
        "distinct_font_weights": len(col.font_weights),
        "distinct_border_radii": len(col.radii),
        "distinct_z_index_values": len(col.z_indexes),
        "max_z_index": max([int(float(z)) for z in col.z_indexes if re.fullmatch(r"-?\d+(\.\d+)?", z)] or [0]),
        "important_declarations": col.important,
        "top_colors": top(col.colors),
        "top_font_sizes": top(col.font_sizes),
        "top_radii": top(col.radii),
    }


def drift_notes(sym):
    notes = []
    if sym["distinct_colors_in_declarations"] > 16:
        notes.append(f"{sym['distinct_colors_in_declarations']} distinct literal colors used directly in declarations; a healthy system uses roughly 8 to 16 via tokens.")
    if sym["distinct_font_sizes"] > 10:
        notes.append(f"{sym['distinct_font_sizes']} distinct font sizes; a scale usually has 6 to 9 steps.")
    if sym["distinct_border_radii"] > 6:
        notes.append(f"{sym['distinct_border_radii']} distinct border radii; typically 3 to 5.")
    if sym["distinct_z_index_values"] > 10 or sym["max_z_index"] >= 999:
        notes.append(f"z-index sprawl: {sym['distinct_z_index_values']} distinct value(s), max {sym['max_z_index']}; use a named scale and the top layer for overlays.")
    if sym["important_declarations"] > 20:
        notes.append(f"{sym['important_declarations']} `!important` declarations suggest specificity conflicts; consider @layer.")
    return notes


def main():
    ap = argparse.ArgumentParser(description="Heuristic static UI/UX scanner")
    ap.add_argument("paths", nargs="+", help="files or directories; '-' reads HTML from stdin")
    ap.add_argument("--format", choices=["md", "json"], default="md")
    ap.add_argument("--max-examples", type=int, default=5)
    ap.add_argument("--min-confidence", choices=["low", "medium", "high"], default="low")
    ap.add_argument("--fail-on", choices=["S0", "S1", "S2", "S3"], default=None,
                    help="exit 1 if any finding at or above this severity (medium+ confidence)")
    args = ap.parse_args()

    col = Collector()
    for path in iter_files(args.paths):
        try:
            text = read(path)
        except OSError as exc:
            print(f"warning: cannot read {path}: {exc}", file=sys.stderr)
            continue
        ext = ".html" if path == "-" else os.path.splitext(path)[1].lower()
        label = "stdin" if path == "-" else path
        col.files_scanned[ext] += 1
        if ext in HTML_EXT:
            scan_html(text, label, col)
        elif ext in CSS_EXT:
            scan_css(text, label, col)
        elif ext in COMPONENT_EXT:
            scan_component(text, label, col)
    aggregate_checks(col, True)

    findings = [f for f in col.findings if CONF_ORDER[f.confidence] >= CONF_ORDER[args.min_confidence]]
    sym = symmetry_report(col)

    # collapse exact duplicates
    seen, uniq = set(), []
    for f in findings:
        key = (f.rule, f.file, f.line, f.message)
        if key not in seen:
            seen.add(key)
            uniq.append(f)
    findings = uniq

    counts = Counter(f.severity for f in findings)

    if args.format == "json":
        out = {
            "files_scanned": dict(col.files_scanned),
            "counts": {k: counts.get(k, 0) for k in ("S0", "S1", "S2", "S3")},
            "symmetry": sym,
            "drift_notes": drift_notes(sym),
            "findings": [f.as_dict() for f in findings],
            "note": "Heuristic candidates only. Confirm before reporting. A clean scan is not a pass.",
        }
        print(json.dumps(out, indent=2))
    else:
        by_rule = defaultdict(list)
        for f in findings:
            by_rule[f.rule].append(f)
        ordered = sorted(by_rule.items(), key=lambda kv: (SEV_ORDER[kv[1][0].severity], -len(kv[1]), kv[0]))
        print("# Static scan results\n")
        print("Files scanned: " + (", ".join(f"{v} {k}" for k, v in col.files_scanned.items()) or "none"))
        print("Candidates by suggested severity: " + ", ".join(f"{k}: {counts.get(k, 0)}" for k in ("S0", "S1", "S2", "S3")))
        print("\n> Heuristic candidates only. Confirm each before reporting it as a defect. A clean scan is not a pass: rendered contrast, focus order, screen reader output and performance are not tested here.\n")
        print("## Findings\n")
        if not ordered:
            print("No candidates found by the static rules.\n")
        for rule, items in ordered:
            sev = min((i.severity for i in items), key=lambda s: SEV_ORDER[s])
            print(f"### {rule} ({sev}, {len(items)} found)")
            distinct_msgs = {i.message for i in items}
            print(items[0].message if len(distinct_msgs) == 1 else f"e.g. {items[0].message}")
            print(f"Fix: {items[0].fix}")
            for i in items[: args.max_examples]:
                loc = i.file if i.line == 0 else f"{i.file}:{i.line}"
                print(f"- {loc} [{i.confidence}]")
            if len(items) > args.max_examples:
                print(f"- ... and {len(items) - args.max_examples} more")
            print()
        print("## Symmetry report (token drift)\n")
        print(f"- Distinct literal colors in declarations: {sym['distinct_colors_in_declarations']} (plus {sym['distinct_colors_defined_as_tokens']} defined as custom-property tokens)")
        print(f"- Distinct font sizes: {sym['distinct_font_sizes']}; font weights: {sym['distinct_font_weights']}")
        print(f"- Distinct border radii: {sym['distinct_border_radii']}")
        print(f"- Distinct z-index values: {sym['distinct_z_index_values']} (max {sym['max_z_index']})")
        print(f"- `!important` declarations: {sym['important_declarations']}")
        if sym["top_colors"]:
            print("- Most used colors: " + ", ".join(sym["top_colors"]))
        for n in drift_notes(sym):
            print(f"- Drift: {n}")
        print()

    if args.fail_on:
        limit = SEV_ORDER[args.fail_on]
        bad = [f for f in findings if SEV_ORDER[f.severity] <= limit and CONF_ORDER[f.confidence] >= CONF_ORDER["medium"]]
        if bad:
            sys.exit(1)


if __name__ == "__main__":
    main()
