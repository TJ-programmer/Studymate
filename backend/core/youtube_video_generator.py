import requests
from llama_cpp import Llama
from pathlib import Path
from typing import List, Dict, Any


# ==============================
# 🔧 CONFIG
# ==============================
MODEL_PATH = Path(__file__).resolve().parents[1] / "model" / "Qwen2.5-VL-3B-Instruct-Q8_0.gguf"
YOUTUBE_API_KEY = ""


# ==============================
# 🤖 LOAD MODEL (Singleton)
# ==============================
model = Llama(
    model_path=str(MODEL_PATH),
    n_ctx=2048,
    n_threads=4
)


# ==============================
# 🧠 QUERY REFINER (LLM)
# ==============================
def refine_query(user_query: str) -> str:
    """
    Convert user input into an optimized YouTube search query
    """

    prompt = f"""
<|system|>
Convert the user's request into a concise YouTube search query.

Rules:
- Keep it under 6 words
- Focus on keywords only
- Remove unnecessary words
- Make it suitable for educational videos

User Input:
{user_query}

<|assistant|>
"""

    response = model(
        prompt,
        max_tokens=50,
        temperature=0.3,
        top_p=0.1,
        stop=["<|user|>", "<|system|>"],
        stream=False
    )

    try:
        refined = response["choices"][0]["text"].strip()
        return refined if refined else user_query
    except Exception:
        return user_query


# ==============================
# 🎥 YOUTUBE SEARCH
# ==============================
def search_youtube(prompt: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Search YouTube videos based on refined query
    """

    query = refine_query(prompt)

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": query,
        "key": YOUTUBE_API_KEY,
        "maxResults": max_results,
        "type": "video",
        "order": "relevance",          # better ranking
        "videoDuration": "medium"      # short | medium | long
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()

        if "items" not in data:
            return {
                "status": "error",
                "message": data
            }

        videos = format_videos(data["items"])

        return {
            "status": "success",
            "query_used": query,
            "count": len(videos),
            "videos": videos
        }

    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "message": str(e)
        }


# ==============================
# 🎯 FORMAT RESPONSE
# ==============================
def format_videos(items: List[Dict]) -> List[Dict]:
    """
    Format YouTube API response into clean structure
    """

    videos = []

    for item in items:
        try:
            video_id = item["id"]["videoId"]
            snippet = item["snippet"]

            videos.append({
                "title": snippet.get("title"),
                "channel": snippet.get("channelTitle"),
                "description": snippet.get("description"),
                "thumbnail": snippet["thumbnails"]["high"]["url"],
                "video_url": f"https://www.youtube.com/watch?v={video_id}",
                "embed_url": f"https://www.youtube.com/embed/{video_id}"
            })

        except KeyError:
            continue

    return videos


# ==============================
# 🚀 MAIN TEST
# ==============================
if __name__ == "__main__":
    result = search_youtube("machine learning in tamil")

    from pprint import pprint
    pprint(result)