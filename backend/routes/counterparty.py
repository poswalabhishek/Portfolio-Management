from xmlrpc.client import boolean
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from pymongo.errors import DuplicateKeyError
from database import database as db
from schemas.counterparty import CounterpartyCreate, Counterparty, CounterpartyBase
from typing import List
from ext_api.finnhub_wrapper import finnhub_client
import requests

router = APIRouter()

@router.get("", response_model=List[Counterparty], response_model_exclude_none=True)
def get_counterparties(symbol: str = None, detailed=False):

    filter = {}
    if symbol:
        filter['symbol'] = symbol
    
    result = []

    latest_calculations = {}
    if detailed:
        query = db.database['calculation'].aggregate([
            {'$match': {'counterparty': symbol} if symbol else {}},
            {'$sort': {'date': -1}},
            {'$group': {'_id': '$counterparty', 'data': {'$first': '$$CURRENT'} }},
        ])
        for q in query:
            latest_calculations[q['_id']] = q['data']

    for counterparty in db.get_counterparties(filter):
        if detailed:
            counterparty['data'] = latest_calculations.get(counterparty['symbol'], None)
        result.append(counterparty)
    
    return result


@router.post("", response_model=Counterparty, status_code=201)
def add_counterparty(counterparty: CounterpartyCreate):
    counterparty = jsonable_encoder(counterparty)
    try:
        db.add_counterparty(counterparty)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Counterparty already existed")


@router.delete("")
def delete_counterparty(symbol: str):
    deleted_count = db.delete_counterparty(symbol)
    if deleted_count:
        return
    else:
        raise HTTPException(status_code=404, detail="Counterparty not found")


@router.get("/search", response_model=List[CounterpartyBase])
def search_counterparties(query: str, new: boolean = False):
    if new:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0'
        }
        url = f'https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=4&newsCount=0&listsCount=0'
        r = requests.get(url, headers=headers)
        return [
            {'symbol': c['symbol'], 'name': c['shortname']}
            for c in r.json()['quotes'] if c['quoteType'] == "EQUITY"
        ]
        # return [
        #     {'symbol': c['symbol'], 'name': c['description']}
        #     for c in finnhub_client.symbol_lookup(query)['result']
        # ]
    else:
        return list(db.get_counterparties(
            {'$or': [
                {'name': {'$regex': query, '$options': 'i'}},
                {'symbol': {'$regex': query, '$options': 'i'}}
            ]}
        ))