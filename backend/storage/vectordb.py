from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, 
    Distance, 
    Filter, 
    FieldCondition, 
    MatchValue,
    PayloadSchemaType,
    Prefetch,
    Range
)

VECTOR_COLLECTION = "rag_studymate"
VECTOR_SIZE = 384

client = QdrantClient(path="./qdrant_storage")

def init_collection(vector_size: int = VECTOR_SIZE):
    collections = [c.name for c in client.get_collections().collections]

    if VECTOR_COLLECTION in collections:
        print(f"Collection '{VECTOR_COLLECTION}' already exists.")
        return

    print(f"Creating collection '{VECTOR_COLLECTION}'...")

    client.create_collection(
        collection_name=VECTOR_COLLECTION,
        vectors_config=VectorParams(
            size=vector_size,
            distance=Distance.COSINE
        ),
    )

    _create_indexes()

def _create_indexes():
    """Create payload indexes for filtering"""
    print("Creating payload indexes...")
    
    client.create_payload_index(
        collection_name=VECTOR_COLLECTION,
        field_name="chat_id",
        field_schema=PayloadSchemaType.KEYWORD
    )
    client.create_payload_index(
        collection_name=VECTOR_COLLECTION,
        field_name="document_id",
        field_schema=PayloadSchemaType.KEYWORD
    )
    
    print("Indexes created successfully.")

def insert_vectors(points: list, batch_size: int = 100):
    init_collection()

    for i in range(0, len(points), batch_size):
        batch = points[i:i + batch_size]

        client.upsert(
            collection_name=VECTOR_COLLECTION,
            points=batch
        )

    print(f"Inserted {len(points)} points successfully")
   

def search_vectors(
    query_vector,
    source,
    page=None,
    start_page=None,
    end_page=None,
    top_k: int = 5
):
    source = source.strip().strip('"')

    if not query_vector or len(query_vector) != VECTOR_SIZE:
        raise ValueError(f"Query vector must have {VECTOR_SIZE} dimensions")

    must_conditions = []

    # ✅ source filter (important for multi-doc)
    if source:
        must_conditions.append(
            FieldCondition(
                key="source",
                match=MatchValue(value=source)
            )
        )

    # ✅ page filtering
    if page is not None:
        must_conditions.append(
            FieldCondition(
                key="page",
                match=MatchValue(value=page)
            )
        )

    elif start_page is not None and end_page is not None:
        must_conditions.append(
            FieldCondition(
                key="page",
                range=Range(gte=start_page, lte=end_page)
            )
        )

    filter_condition = Filter(must=must_conditions) if must_conditions else None

    response = client.query_points(
        collection_name=VECTOR_COLLECTION,
        query=query_vector,
        query_filter=filter_condition,
        limit=top_k,
        with_payload=True,
        with_vectors=False
    )

    print(f"Found {len(response.points)} results")

    return response.points

def delete_by_source(source: str):
    """Delete all points associated with a source"""
    client.delete(
        collection_name=VECTOR_COLLECTION,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="source",
                    match=MatchValue(value=source)
                )
            ]
        )
    )
    print(f"Deleted points for source: {source}")

