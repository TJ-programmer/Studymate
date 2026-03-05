import hashlib
from cachetools import TTLCache

memory_cache = TTLCache(maxsize=500,ttl=600)

def generate_cache_key(prompt:str):
    return hashlib.sha256(prompt.encode()).hexdigest()

def get_cached(prompt:str):
    key = generate_cache_key(prompt)
    return memory_cache.get(key)

def set_cache(prompt:str,value:str):
    key = generate_cache_key(prompt)
    memory_cache[key]= value

