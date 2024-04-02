from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from pymongo.errors import DuplicateKeyError
from database import database as db
from schemas.counterparty import CounterpartyCreate, Counterparty
from typing import List
from ext_api.finnhub_wrapper import finnhub_client
from schemas.lda import Lda

router = APIRouter()

@router.get("", response_model=Lda)
def get_lda(symbol: str):
    result = db.get_lda(symbol)
    return {
        'datetime': result['datetime'],
        'topics': result['model'].show_topics(formatted=False)
    }