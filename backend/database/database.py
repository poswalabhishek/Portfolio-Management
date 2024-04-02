import pickle
import logging
import secret_keys
from typing import List
from pymongo import ASCENDING, DESCENDING, MongoClient, UpdateOne
from pymongo.collection import ReturnDocument
from database.database_helper import InsertIfNotExist, UpsertOne
from datetime import datetime
from bson.objectid import ObjectId

client = MongoClient(
    secret_keys.mongo_uri
)

logger = logging.getLogger(__name__)
database = client['portfolio_alert']

counterparty_collection = database.get_collection('counterparty')
counterparty_ingest_status_collection = database.get_collection('counterparty_ingest_status')
counterparty_daily_stock_collection = database.get_collection('counterparty_daily_stock_price')
news_collection = database.get_collection('news')
calculation_collection = database.get_collection('calculation')
lda_collection = database.get_collection('lda')

def add_counterparty(counterparty: dict):
    result = counterparty_collection\
        .insert_one(counterparty)
    
    return counterparty_collection.find_one({'_id': result.inserted_id})


def get_counterparties(filter: dict = {}):
    return counterparty_collection.find(filter)

def get_counterparty(filter: dict = {}):
    return counterparty_collection.find_one(filter)

def delete_counterparty(symbol: str):
    result = counterparty_collection.delete_one({'symbol': symbol})
    database['alert'].delete_many({'counterparty': symbol})
    return result.deleted_count


def get_one_counterparty_ingest_status(query):
    return counterparty_ingest_status_collection.find_one(query)

def update_counterparty_ingest_status(query, update):
    return counterparty_ingest_status_collection.find_one_and_replace(query, update, upsert=True, return_document=ReturnDocument.AFTER)


def add_counterparty_stock_candles(candles):
    for candle in candles:
        if 'date' not in candle:
            logger.error('Candle must have date')
            return False
        else:
            temp = candle['date']
            candle['date'] = datetime(temp.year, temp.month, temp.day)

    try:
        operations = [
            UpsertOne(candle, keys=['counterpartyId', 'date'])  # use upsert instead of insert
            for candle in candles
        ]
        result = counterparty_daily_stock_collection.bulk_write(operations, ordered=False)
    except Exception as e:
        logger.warning('Could not insert. Exception: '+str(e))
        return False

    return result

def get_counterparty_stock_candles(filter, limit=1000):
    return counterparty_daily_stock_collection.find(filter).sort('date', DESCENDING).limit(limit)

def add_news(news_datum: List[dict]):
    if not news_datum:
        return  # skip operations if news_datum is empty

    operations = [ 
        InsertIfNotExist(news_data, keys = ['counterparty', 'datetime', 'headline'])
        for news_data in news_datum
    ]  

    news_collection.bulk_write(operations, ordered=False)
    return

def update_news(news_datum: List[dict]):
    # [{"_id": XXX, "sentiment": "positive"}, {"_id": XXX, "sentiment": "negative"}]

    if not news_datum:
        return  # skip operations if news_datum is empty

    operations = [
        UpdateOne(
            {"_id": news_data["_id"] },
            {"$set": news_data}
        )
        for news_data in news_datum
    ]

    news_collection.bulk_write(operations, ordered=False)
    return

def get_news(filter=None, projection=None, skip: int = 0, limit: int = 0, sort = False):
    if sort:
        return news_collection\
            .find(filter, projection)\
            .sort('datetime', DESCENDING)\
            .skip(skip)\
            .limit(limit)
    else:
        return news_collection\
            .find(filter, projection)\
            .skip(skip)\
            .limit(limit)

def aggregate_news(pipeline):
    return news_collection\
        .aggregate(pipeline)



def add_calculations(calculations: List[dict]):
    if not calculations:
        return

    operations = [
        UpsertOne(calculation, keys = ['date', 'counterparty'])
        for calculation in calculations
    ]
    return calculation_collection.bulk_write(operations, ordered=False)

def get_calculations(filter, limit=0):
    return calculation_collection\
        .find(filter)\
        .sort('date', DESCENDING)\
        .limit(limit)

def save_lda(counterpartyId, model):
    data = { 
        'counterpartyId': counterpartyId, 
        'model': pickle.dumps(model),
        'datetime': datetime.utcnow()
    }
    return lda_collection\
        .insert_one(data)

def get_lda(symbol: str):

    counterparty = counterparty_collection.find_one({'symbol': symbol})
    
    if counterparty is None:
        return None
    
    filter = { "counterpartyId": counterparty['_id']}
    result = lda_collection.find_one(filter)
    
    if result is None:
        return None
    
    return {
        **result,
        'model': pickle.loads(result['model'])
    }

def get_topics(filter = None, projection = None):
    return database['topic'].find(filter, projection)


def get_topic(id: ObjectId):
    return database['topic'].find_one({
        '_id': id
    })


def add_topic(topic: dict):
    return database['topic'].insert_one(topic)


def delete_topic(id: ObjectId):
    return database['topic'].delete_one({'_id': id})


def add_alert(alert: dict):
    
    keys = ["category", "counterparty", "date", "type"]
    check_duplicate_filter = { key: alert[key] for key in keys }
    if database['alert'].find_one(check_duplicate_filter) is None:
        return database['alert'].insert_one(alert)


def get_alerts(filter: dict, skip: int = 0, limit: int=0):
    return database['alert'].find(filter)\
        .sort([
            ('priority', DESCENDING),
            ('date', DESCENDING),
            ('category', ASCENDING),
            ('percentile', ASCENDING)
        ])\
        .skip(skip)\
        .limit(limit)