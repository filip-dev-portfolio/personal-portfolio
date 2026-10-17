from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Filip Shahanski | Engineering Portfolio")

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)

templates = Jinja2Templates(directory=BASE_DIR / "templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"active_page": "home"},
    )


@app.get("/experience", response_class=HTMLResponse)
async def experience(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="experience.html",
        context={"active_page": "experience"},
    )


@app.get("/projects", response_class=HTMLResponse)
async def projects(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="projects.html",
        context={"active_page": "projects"},
    )


@app.get("/background", response_class=HTMLResponse)
async def background(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="background.html",
        context={"active_page": "background"},
    )


@app.get("/health")
async def health():
    return {"status": "online"}