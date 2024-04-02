from fastapi import APIRouter
from database import database as db
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from pydantic.json import ENCODERS_BY_TYPE

ENCODERS_BY_TYPE[np.int64] = lambda x: int(x)

router = APIRouter()

@router.get("")
def get_overview(date: str = None):

    filter = {}
    if date:
        filter['date'] = {
            '$lte': date,
            '$gte': (datetime.fromisoformat(date) - timedelta(5)).strftime('%Y-%m-%d')
        }
    else:
        filter['date'] = { '$gte': (datetime.now() - timedelta(5)).strftime('%Y-%m-%d')}
    
    query = db.database['calculation'].aggregate([
        {'$match': filter},
        {'$sort': {'date': -1}},
        {'$group': {'_id': '$counterparty', 'sentiment': {'$push': '$sentiments.rolling_avg'} }},
        {'$project': {'sentiment': {'$slice': ['$sentiment', 2]}}}
    ])

    df = pd.DataFrame([q['sentiment'] for q in query])

    if date:
        del filter['date']['$gte']
    else:
        del filter['date']
    query = db.database['calculation'].aggregate([
        {'$match': filter},
        {'$group': {'_id': '$date', 'sentiment': {'$avg': '$sentiments.rolling_avg'} }},
        {'$sort': {'_id': -1}},
        {'$limit': 400},
        {'$project': {'_id': False, 'date': '$_id', 'sentiment': 1} }
    ])
    
    result = {
        'd_sentiment': {
            'positive': (df[0] > df[1]).sum(),
            'neutral': (df[0] == df[1]).sum(),
            'negative': (df[0] < df[1]).sum()
        },
        'sentiment': {
            'positive': (df[0] > 0.3).sum(), #median
            'neutral': ((df[0] >= 0) & (df[0] <= 0.3)).sum(), 
            'negative': (df[0] < 0).sum(), # z = 0.07
            'history':  [[q['date'], q['sentiment']] for q in query]
        }
    }


    return result