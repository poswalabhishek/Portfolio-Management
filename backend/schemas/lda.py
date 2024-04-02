from datetime import datetime
from pydantic import BaseModel
from typing import List, Tuple

class Lda(BaseModel):
    datetime: datetime
    topics: List[Tuple[int, List[Tuple[str, float]]]]