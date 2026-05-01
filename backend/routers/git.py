from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter(
    prefix="/git",
    tags=["git"]
)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

@router.get("/{owner}/{repo}/commits")
async def get_commits(owner: str, repo: str, limit: int = 5):
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/commits?per_page={limit}",
            headers=headers
        )
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Failed to fetch commits")
        
        commits = res.json()
        return [{"sha": c["sha"], "message": c["commit"]["message"], "author": c["commit"]["author"]["name"], "date": c["commit"]["author"]["date"]} for c in commits]

@router.get("/{owner}/{repo}/issues")
async def get_issues(owner: str, repo: str, limit: int = 5):
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
        
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page={limit}",
            headers=headers
        )
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Failed to fetch issues")
            
        issues = res.json()
        return [{"number": i["number"], "title": i["title"], "state": i["state"], "url": i["html_url"]} for i in issues]
