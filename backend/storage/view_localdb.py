from qdrant_client import QdrantClient
from tabulate import tabulate

VECTOR_COLLECTION = "rag_studymate"

client = QdrantClient(path="E:\studymate\qdrant_storage")


def table_view(limit=10):
    points, _ = client.scroll(
        collection_name=VECTOR_COLLECTION,
        limit=limit,
        with_payload=True,
        with_vectors=False
    )

    table = []

    for p in points:
        payload = p.payload or {}

        table.append([
            str(p.id),
            payload.get("source", "N/A"),
            payload.get("page", "N/A"),
            (payload.get("text", "")[:60] + "...") if payload.get("text") else ""
        ])

    print("\n📊 Qdrant Data Preview:\n")
    print(tabulate(
        table,
        headers=["ID", "Source", "Page", "Text Preview"],
        tablefmt="fancy_grid"   # try: grid, simple, pretty
    ))


if __name__ == "__main__":
    table_view(limit=10)