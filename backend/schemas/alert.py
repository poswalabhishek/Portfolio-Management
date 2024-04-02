from datetime import datetime
from xmlrpc.client import Boolean
from pydantic import BaseModel
from typing import Optional, Union
from schemas.chart import CalculationData
from schemas.counterparty import Counterparty

class Alert(BaseModel):
    id: str
    date: datetime
    counterparty: str
    category: str
    type: str
    counterparty: Union[str, Counterparty]
    value: float
    percentile: float
    feedback: Optional[Boolean]
    data: Optional[CalculationData]