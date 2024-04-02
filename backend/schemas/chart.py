from pydantic import BaseModel
from typing import Optional, List

class CalculationData(BaseModel):
    date: str #format: 2021-12-06
    #keyword_count: Optional[dict]
    topic_count: Optional[dict]
    news_count: Optional[int]
    sentiments: Optional[dict]

class PriceData(BaseModel):
    date: str
    price: List[float]