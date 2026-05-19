import logging
import re
from typing import Optional, Tuple
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
)

logger = logging.getLogger(__name__)

MAX_CHARS = 30000

_ID_REGEX = re.compile(r"^[A-Za-z0-9_-]{11}$")


def _extract_video_id(url_or_id: str) -> Optional[str]:
    s = url_or_id.strip()

    if _ID_REGEX.match(s):
        return s

    try:
        parsed = urlparse(s)
    except Exception:
        return None

    host = (parsed.hostname or "").lower()

    if host in {"youtu.be"}:
        candidate = parsed.path.lstrip("/").split("/")[0]
        return candidate if _ID_REGEX.match(candidate) else None

    if "youtube.com" in host or "youtube-nocookie.com" in host:
        qs = parse_qs(parsed.query)
        if "v" in qs and qs["v"]:
            candidate = qs["v"][0]
            return candidate if _ID_REGEX.match(candidate) else None
        # /embed/<id>, /shorts/<id>, /v/<id>
        parts = [p for p in parsed.path.split("/") if p]
        if len(parts) >= 2 and parts[0] in {"embed", "shorts", "v"}:
            candidate = parts[1]
            return candidate if _ID_REGEX.match(candidate) else None

    return None


def _format_transcript(fetched) -> str:
    pieces = []
    for snippet in fetched:
        text = (snippet.text or "").strip()
        if not text or text == "[Music]":
            continue
        pieces.append(text.replace("\n", " "))
    return " ".join(pieces)


def fetch_youtube_transcript(
    url_or_id: str,
    preferred_language: Optional[str] = None,
) -> Tuple[str, dict, bool]:
    """
    Return (transcript_text, metadata, truncated).
    Raises ValueError if no transcript is accessible.
    """
    video_id = _extract_video_id(url_or_id)
    if not video_id:
        raise ValueError("URL ose ID e pavlefshme e YouTube-it")

    api = YouTubeTranscriptApi()

    try:
        listing = api.list(video_id)
    except TranscriptsDisabled:
        raise ValueError("Ky video nuk ka transcript te lejuar nga autori") from None
    except VideoUnavailable:
        raise ValueError("Videoja nuk eshte e disponueshme") from None
    except Exception as exc:
        raise ValueError(f"Deshtoi marrja e listes se transcript-eve: {exc}") from exc

    available_codes = [t.language_code for t in listing]
    if not available_codes:
        raise ValueError("Asnje transcript nuk eshte i disponueshem per kete video")

    transcript = None
    if preferred_language:
        try:
            transcript = listing.find_transcript([preferred_language])
        except NoTranscriptFound:
            transcript = None

    if transcript is None:
        try:
            transcript = listing.find_manually_created_transcript(available_codes)
        except NoTranscriptFound:
            transcript = None

    if transcript is None:
        try:
            transcript = listing.find_generated_transcript(available_codes)
        except NoTranscriptFound:
            transcript = None

    if transcript is None:
        raise ValueError("Asnje transcript nuk u gjet per kete video")

    try:
        fetched = transcript.fetch()
    except Exception as exc:
        raise ValueError(f"Deshtoi marrja e transcript-it: {exc}") from exc

    raw = _format_transcript(fetched)
    if not raw or len(raw) < 50:
        raise ValueError("Transcript-i eshte bosh ose shume i shkurter")

    truncated = False
    if len(raw) > MAX_CHARS:
        raw = raw[:MAX_CHARS]
        truncated = True

    metadata = {
        "video_id": video_id,
        "language": fetched.language_code,
        "language_name": fetched.language,
        "auto_generated": fetched.is_generated,
    }
    return raw, metadata, truncated
