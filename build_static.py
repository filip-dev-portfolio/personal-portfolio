
import os
from pathlib import Path
from shutil import copytree, rmtree

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent
TEMPLATES_DIR = ROOT / "app" / "templates"
STATIC_DIR = ROOT / "app" / "static"
OUTPUT_DIR = ROOT / "docs"

# "/" for a custom domain; "/repository-name/" for a
# GitHub Pages project site.
SITE_BASE = "/" + os.environ.get("SITE_BASE", "").strip("/") + "/"

if SITE_BASE == "//":
    SITE_BASE = "/"

if OUTPUT_DIR.exists():
    rmtree(OUTPUT_DIR)

OUTPUT_DIR.mkdir(parents=True)

env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)

routes = {
    "home": "",
    "experience": "experience/",
    "projects": "projects/",
    "background": "background/",
}


def url_for(endpoint, **values):
    if endpoint == "static":
        path = values.get("path", "").lstrip("/")
        return f"{SITE_BASE}static/{path}"

    if endpoint in routes:
        return f"{SITE_BASE}{routes[endpoint]}"

    raise ValueError(f"Unknown endpoint: {endpoint}")


env.globals["url_for"] = url_for

pages = {
    "index.html": ("index.html", "home"),
    "experience/index.html": ("experience.html", "experience"),
    "projects/index.html": ("projects.html", "projects"),
    "background/index.html": ("background.html", "background"),
}

for output_path, (template_name, active_page) in pages.items():
    destination = OUTPUT_DIR / output_path
    destination.parent.mkdir(parents=True, exist_ok=True)

    template = env.get_template(template_name)
    html = template.render(active_page=active_page)

    destination.write_text(html, encoding="utf-8")
    print(f"Generated {output_path}")

copytree(STATIC_DIR, OUTPUT_DIR / "static")

# Prevent GitHub Pages from treating files as Jekyll content.
(OUTPUT_DIR / ".nojekyll").touch()

print(f"\nStatic site built successfully: {OUTPUT_DIR}")
print(f"Base path: {SITE_BASE}")
