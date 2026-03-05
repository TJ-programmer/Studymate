import time
from collections import defaultdict

requests = defaultdict(list)

MAX_REQUESTS = 10
WINDOW = 60


def check_rate_limit(user_id: str):

    now = time.time()

    requests[user_id] = [
        t for t in requests[user_id]
        if now - t < WINDOW
    ]

    if len(requests[user_id]) >= MAX_REQUESTS:
        return False

    requests[user_id].append(now)

    return True