from groq import Groq
from app.config import settings
import json
import re
from typing import Any


class LLMClient:
    """
    Pluggable LLM client — configured for Groq llama-3.1-8b-instant.
    To swap providers, update GROQ_API_KEY and GROQ_MODEL in .env.
    """

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.GROQ_MODEL
        self.default_params = {
            "temperature": 0.4,
            "max_tokens": 2048,
            "top_p": 0.9,
        }

    def chat(self, messages: list[dict], **kwargs) -> str:
        """Send a chat completion request and return the text response."""
        params = {**self.default_params, **kwargs}
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **params,
        )
        return response.choices[0].message.content.strip()

    def chat_json(self, messages: list[dict], **kwargs) -> Any:
        """
        Request a JSON response from the LLM.
        Adds a system hint and parses the output.
        """
        # Inject JSON mode instruction
        messages = list(messages)
        if messages and messages[0]["role"] == "system":
            messages[0]["content"] += "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no extra text."
        else:
            messages.insert(0, {
                "role": "system",
                "content": "IMPORTANT: Respond ONLY with valid JSON. No markdown, no extra text."
            })

        params = {**self.default_params, **kwargs}
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            **params,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Attempt to extract JSON object from response
            match = re.search(r"\{.*\}|\[.*\]", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError(f"LLM did not return valid JSON. Raw: {raw[:300]}")


# Singleton
llm_client = LLMClient()
