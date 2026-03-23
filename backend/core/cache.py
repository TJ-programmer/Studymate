import hashlib
from cachetools import TTLCache
import json

memory_cache = TTLCache(maxsize=500,ttl=600)

def generate_cache_key(messages):
    serialized = json.dumps(messages,sort_keys=True)
    return hashlib.sha256(serialized.encode()).hexdigest()

def get_cached(messages):
    key = generate_cache_key(messages)
    return memory_cache.get(key)

def set_cache(messages,value:str):
    key = generate_cache_key(messages)
    memory_cache[key]= value

