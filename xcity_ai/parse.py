import csv
import json
import logging
import os
import re

import httpx
from docx import Document
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


def read_docx(file_path: str):
    doc = Document(file_path)
    content = []
    for para in doc.paragraphs:
        content.append(para.text)
    return "\n".join(content)


def organize_content(
    content: str,
    temperature: float = 0.3,
    top_p: float = 0.7,
    max_tokens: int = 4096,
    timeout: int = 180,
):
    system_prompt = (
        "Please extract and organize the following information "
        "from the resume for HR:\n"
        "1. Job position\n"
        "2. Years of work experience\n"
        "3. Professional skills\n"
        "4. Educational background\n"
        "5. Work experience\n\n"
        "The resume content is enclosed between `<start>` and `<end>`.\n\n"
        "Requirements:\n"
        "1. Output in JSON format:\n"
        "\t```\n"
        "\t{\n"
        '\t\t"job_title": "xxx",\n'
        '\t\t"work_years": "xxx",\n'
        '\t\t"skills": "xxx",\n'
        '\t\t"education": "xxx",\n'
        '\t\t"work_experience": "xxx"\n'
        "\t}\n"
        "\t```\n"
        "2. If the resume is not in English, "
        "please translate it into English before organizing and outputting.\n"
        "3. The organized content should be concise, including only key information, "
        "similar to an abstract in a thesis, to facilitate searching."
    )
    user_prompt = f"Resume:\n```<start>\n{content}\n<end>```\n"

    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.getenv('VOLCENGINE_API_KEY', '')}",
    }
    payload = {
        "model": os.getenv("VOLCENGINE_MODEL", ""),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
    }

    r = httpx.post(url=url, json=payload, headers=headers, timeout=timeout)
    try:
        r.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"Calling LLM error: {e.response.text}")
        raise e
    return r.json()["choices"][0]["message"]["content"]


def load_data(content: str):
    pattern = r"```(.*?)```"
    matches = re.findall(pattern, content, re.DOTALL)
    data = []
    for match in matches:
        try:
            data.append(json.loads(match))
        except json.JSONDecodeError as e:
            logger.error(f"Parsing JSON error: {e}")
    return data


def dump_to_csv(dataset: dict, folder_path: str):
    for key, value in dataset.items():
        if not value:
            continue
        file_path = os.path.join(folder_path, f"{key}.csv")
        with open(file_path, "wt") as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(("resume_name", "content"))
            for file_name, content in value.items():
                writer.writerow((file_name, content))


def main(in_folder_path: str, out_folder_path: str):
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    load_dotenv()

    dataset = {
        "job_title": {},
        "work_years": {},
        "skills": {},
        "education": {},
        "work_experience": {},
    }
    for filename in os.listdir(in_folder_path):
        if filename.endswith(".docx"):
            file_path = os.path.join(in_folder_path, filename)
            content = read_docx(file_path)
            organized_content = organize_content(content)
            data = load_data(organized_content)
            if not data:
                continue
            for key, value in data[0].items():
                if key in dataset:
                    dataset[key][filename] = value
    dump_to_csv(dataset, out_folder_path)


if __name__ == "__main__":
    in_folder_path = "data/cv"
    out_folder_path = "data/corpus"
    main(in_folder_path, out_folder_path)
