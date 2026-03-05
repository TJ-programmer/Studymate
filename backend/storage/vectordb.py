from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, 
    Distance, 
    Filter, 
    FieldCondition, 
    MatchValue,
    PayloadSchemaType,
    Prefetch
)

VECTOR_COLLECTION = "rag_justtalks"
VECTOR_SIZE = 384
QDRANT_URL = "https://eb0db813-6b2c-4982-97a3-1e2c45324ffb.europe-west3-0.gcp.cloud.qdrant.io"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.UFaUEDX3yAc7Yam_4YMUymQovnd6G3LevqLk5KLK4xU"

client = QdrantClient(
    url=QDRANT_URL,
    api_key=API_KEY
)

def init_collection(vector_size: int = VECTOR_SIZE, recreate: bool = False):
    existing_collections = [c.name for c in client.get_collections().collections]
    
    if VECTOR_COLLECTION in existing_collections:
        if recreate:
            print(f"Recreating collection '{VECTOR_COLLECTION}'...")
            client.recreate_collection(
                collection_name=VECTOR_COLLECTION,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                ),
            )
            _create_indexes()
        else:
            print(f"Collection '{VECTOR_COLLECTION}' already exists. Skipping creation.")
    else:
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

def insert_vectors(points: list):
   
    init_collection(recreate=False)
    
    client.upsert(
        collection_name=VECTOR_COLLECTION,
        points=points
    )
    print(f"Inserted {len(points)} points successfully")

def search_vectors(query_vector, chat_id: str, top_k: int = 5):
    """Search vectors using the query API with chat_id filter"""
    
    chat_id = chat_id.strip().strip('"')

    # Validate query vector
    if not query_vector or len(query_vector) != VECTOR_SIZE:
        raise ValueError(f"Query vector must have {VECTOR_SIZE} dimensions")
    
    # Create filter condition
    filter_condition = Filter(
        must=[
            FieldCondition(
                key="chat_id",
                match=MatchValue(value=chat_id)
            )
        ]
    )

    response = client.query_points(
        collection_name=VECTOR_COLLECTION,
        query=query_vector,              # ✅ REQUIRED
        query_filter=filter_condition,   # ✅ CORRECT PLACE
        limit=top_k,
        with_payload=True,
        with_vectors=False
    )


    
    print(f"Found {len(response.points)} results for chat_id: '{chat_id}'")
    
    return response.points

def delete_by_document(document_id: str):
    """Delete all points associated with a document"""
    client.delete(
        collection_name=VECTOR_COLLECTION,
        points_selector=Filter(
            must=[
                FieldCondition(
                    key="document_id", 
                    match=MatchValue(value=document_id)
                )
            ]
        )
    )
    print(f"Deleted points for document_id: {document_id}")

def debug_chat_ids():
    """Check what chat_ids are actually stored in the collection"""
    
    # Get a sample of points
    response = client.scroll(
        collection_name=VECTOR_COLLECTION,
        limit=10,
        with_payload=True,
        with_vectors=False
    )
    
    print(f"\n=== Stored Points Sample ===")
    print(f"Total points retrieved: {len(response[0])}")
    
    chat_ids = set()
    for point in response[0]:
        print(f"\nPoint ID: {point.id}")
        print(f"Payload: {point.payload}")
        
        if 'chat_id' in point.payload:
            chat_id = point.payload['chat_id']
            chat_ids.add(chat_id)
            print(f"  chat_id: '{chat_id}' (type: {type(chat_id)})")
        else:
            print(f"  ⚠️ No 'chat_id' field found!")
    
    print(f"\n=== Unique chat_ids found ===")
    for cid in chat_ids:
        print(f"  - '{cid}' (type: {type(cid)})")
    
    return list(chat_ids)

