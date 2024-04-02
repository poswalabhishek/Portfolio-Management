import logging
from datetime import datetime, timedelta, timezone

from pymongo.collection import ReturnDocument

import models.config as modelConfig
from calculations.aggregate import aggregate_sentiments_daily, aggregate_topic_count_daily
from calculations.topicScorer import scorer
from database import database as db
from ext_api import finnhub_wrapper, yahoo_finance
from models.keywordModelling import keyword_count
from models.ldaModel import get_lda
from models.transformerInfer import transformerInfer

logger = logging.getLogger(__name__)

def daily_ingest_external_data_cron():
    logger.info("daily ingest data in progress")
    check_counterparty_status()
    logger.info("daily ingest data completed")



def daily_update_calculation_cron():
    logger.info("daily update calculation in progress")
    add_sentiment()
    #add_news_keyword_count()
    add_daily_aggregated_calculations()
    add_lda()
    logger.info("daily update calculation completed")



def ingest_stock_price(ingest_date, args):
    logger.debug("Start ingesting stock price for "+args['symbol'])

    if ingest_date == None:
        ingest_date = datetime(2000, 1, 1)

    # ingest_date += timedelta(days=1)
    hist = yahoo_finance.fetch_historical_daily_stock_candles(args['symbol'], start=ingest_date, end=datetime.now(timezone.utc))
    if not len(hist.index):
        logger.warning(f"No stock price found for {args['symbol']} since {ingest_date}")
        return False
    
    candles = []
    for date, day_range in hist.iterrows():
        doc = {}
        doc['date'] = date
        doc['counterpartyId'] = args['_id']
        doc.update(dict(day_range))
        
        doc['refOnly'] = {'name': args['name'], 'symbol': args['symbol']}

        candles.append(doc)
    
    result = db.add_counterparty_stock_candles(candles)

    if result == False:
        return False
    return True
            

def ingest_news(date, args):
    logger.debug("Ingest news")
    counterparty = args['symbol']
    logger.debug("Start ingesting news for "+counterparty)
    
    try:
        news = finnhub_wrapper.fetch_historical_stock_news(counterparty, date)
        db.add_news(news)
    except Exception as e:
        logger.error("New ingest failed for "+counterparty, e)
        return False

    return True

def check_counterparty_status():
    logger.debug("Start ingest")

    ingest_functions = [
        ingest_news,
        ingest_stock_price,
    ]

    for counterparty in db.get_counterparties():
        query = {'counterpartyId': counterparty['_id']}
        status = db.get_one_counterparty_ingest_status(query)

        if status == None:
            status = dict(zip([f.__name__ for f in ingest_functions], [None]*len(ingest_functions)))
            status['counterpartyId'] = counterparty['_id']
            status['symbolRef'] = counterparty['symbol']

        args = {**counterparty}

        for func in ingest_functions:
            #run function, save date if successful
            if func(status[func.__name__], args):
                status[func.__name__] = datetime.now(timezone.utc)

        updated = db.update_counterparty_ingest_status(query, status)
        logging.debug('counterparty status updated'+str(updated))

'''
Adds sentiment to news articles without one as well as topic scores and embedding.
'''
def add_sentiment():
    sentModel = transformerInfer(modelConfig, scorer)

    # start_dt = datetime(2021, 10, 14)
    # unix_start_dt = start_dt.replace(tzinfo=timezone.utc).timestamp()
    # end_dt = datetime(2021, 10, 16)
    # unix_end_dt = end_dt.replace(tzinfo=timezone.utc).timestamp()
    logger.info("Start adding sentiment")
    filter = {"embedding":{"$exists": False}}
    update_size = 512 #infer news by batch to prevent infinite stuck, also affects num of embedding held in mem bf db update

    while db.get_news(filter).count():
        news_no_sentiment = list(db.get_news(filter, projection=["headline"], limit=update_size))
        # logger.info(f'db ops done, compute of news infer started')

        sentModel.set_news(news_no_sentiment)
        inferred_result = sentModel.infer()

        logger.info(f'infer of {len(inferred_result)} news completed')
        db.update_news(inferred_result)

    logger.info("done")


'''
Adds keyword count to news articles without one.
'''
def add_news_keyword_count():
    logger.info("Start adding keyword count")
    
    keyword_list_changed = False #TODO
    if keyword_list_changed:
        filter = {}
    else:
        filter = {'keyword_count': {'$exists': False}}

    news_no_keyword_count = db.get_news(filter, projection=["headline", "summary"])
    result = [{
        '_id': news['_id'],
        'keyword_count': keyword_count(news['headline']+news['summary'])
    } for news in news_no_keyword_count]
    db.update_news(result)
    logger.info(f'added keyword counts for {len(result)} news')


'''
Aggregate news results of the same day
'''
def add_daily_aggregated_calculations():
    sentiments = aggregate_sentiments_daily()
    db.add_calculations(sentiments)
    topics = aggregate_topic_count_daily()
    db.add_calculations(topics)


def add_lda():
    for counterparty in db.get_counterparties():
        if db.lda_collection.find_one({'counterpartyId': counterparty['_id']}) is None:
            filter = {'counterparty': counterparty['symbol']}
            news = db.get_news(filter, projection=["headline", "summary"])
            sentences = [new['headline'] + ' ' + new['summary'] for new in news]
            model = get_lda(sentences)
            if model:
                db.save_lda(counterparty['_id'], model)
                logger.info(f'lda added for {counterparty["symbol"]}')