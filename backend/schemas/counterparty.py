from pydantic import BaseModel
from typing import Optional
from schemas.chart import CalculationData

class CounterpartyBase(BaseModel):
    name: str
    symbol: str

class CounterpartyCreate(CounterpartyBase):
    pass

class Counterparty(CounterpartyBase):
    data: Optional[CalculationData] = None