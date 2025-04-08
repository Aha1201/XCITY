import json
import logging
import os

import httpx
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


def call_agent(content: str, user_id: str, timeout: int = 5):
    url = "https://api.coze.cn/v3/chat"
    headers = {
        "Authorization": f"Bearer {os.getenv('COZE_API_KEY', '')}",
        "Content-Type": "application/json",
    }
    payload = {
        "bot_id": "7488957668884267049",
        "user_id": "123",
        "stream": True,
        "additional_messages": [{"content": "hello", "role": "user"}],
    }

    with httpx.stream(
        method="POST", url=url, json=payload, headers=headers, timeout=timeout
    ) as r:
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"Calling coze error: {e.response.text}")
            raise e

        flag = False
        delta_event = "event:conversation.message.delta"
        start_str = "data:"
        for line in r.iter_lines():
            if line == delta_event:
                flag = True
                continue

            if not flag or not line.startswith(start_str):
                continue

            flag = False
            data = json.loads(line[len(start_str) :])
            content = data.get("content", "")
            if content:
                yield content


def main(content: str, user_id: str):
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    load_dotenv()

    for each in call_agent(content, user_id):
        logger.info(each)


if __name__ == "__main__":
    content = "hello"
    user_id = "123"
    main(content, user_id)
