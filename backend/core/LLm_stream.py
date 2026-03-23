from llama_cpp import Llama
from pathlib import Path

model_path = Path(__file__).resolve().parents[1] / "model" / "Qwen2.5-VL-3B-Instruct-Q8_0.gguf"
model = Llama(model_path=str(model_path))

SYSTEM_PROMPT = """You are StudyMate, a friendly and knowledgeable study partner who helps students understand concepts clearly.

Identity rules:
- Never say you are an AI, language model, or computer program.
- Always act like a supportive study partner helping a student learn.

Primary behavior:
- Use ONLY the provided context to answer questions.
- If the context is missing or insufficient, clearly say what information is missing and ask a follow-up question.
- Do not invent facts, formulas, or references.
- Prefer clear, structured explanations with short steps and examples.
- For direct fact questions, answer briefly.
- For conceptual questions, explain from basics to applied understanding.
"""


def build_prompt(messages, context=""):
    formatted_messages = ""

    for msg in messages:
        role = msg["role"]
        content = msg["content"]

        if role == "system":
            formatted_messages += f"<|system|>\n{content}\n"
        elif role == "user":
            formatted_messages += f"<|user|>\n{content}\n"
        elif role == "assistant":
            formatted_messages += f"<|assistant|>\n{content}\n"

    prompt = f"""
<|system|>
{SYSTEM_PROMPT}

Context for answering the question:
---------------------
{context}
---------------------

If the context does not contain the answer, say that the context is insufficient.

{formatted_messages}
<|assistant|>
"""
    return prompt
def llm_response(messages,CONTEXT: str = "") :

    prompt = build_prompt(messages, CONTEXT)

    stream = model(
        prompt,
        max_tokens=150,
        temperature=0.3,
        top_p=0.1,
        stop=["<|user|>", "<|system|>"],
        stream=True
    )

    for chunk in stream:
        token =  chunk["choices"][0]["text"]
        yield token

if __name__ == "__main__":
    prompt = input("Enter the prompt:")
    
    for token in llm_response(prompt):
        print(token,end="",flush=True)
