import logging
import numpy as np

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from calculations.topicScorer import scorer
from database import database as db
from schemas.topic import Topic, TopicCreate
from typing import List
from ext_api.finnhub_wrapper import finnhub_client
from bson.objectid import ObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[Topic])
def get_topics():
    result = []
    filter = { 'keywords': {"$exists": True} }
    for topic in db.get_topics(filter, projection={'embedding':False}):
        topic['id'] = str(topic['_id'])
        result.append(topic)
    return result

@router.get("/", response_model=Topic)
def get_topic(id: str):
    id = ObjectId(id)
    result = db.get_topic(id=id)
    result['id'] = str(result['_id'])
    return result

'''
Don't know how scalable this route is
Generates and returns scores for one topic, for all news of a counterparty on a given date, higher than a given score

Params:
    sim_threshold: float, similarity threshold (with 1 being most similar), articles below threshold are not returned
    counterparty: str, the symbol, e.g. TSLA
    date: str, date in format YYYY-MM-DD, e.g. 2021-07-29
    title (optional XOR): str, the title of the topic
    id (optional XOR): str, the id of the topic

Returns:
    list of news dicts: [{'_id': str, headline': str, 'score': float}, ...]
'''
@router.get("/get_articles") #TODO: response model
def get_topic_articles(sim_threshold: float, counterparty: str, date: str, title: str = None, id: str = None):
    if title is None and id is None:
        raise HTTPException(status_code=400, detail='Must provide either title or id')
    
    # get title from db if id is provided
    if id is not None:
        id = ObjectId(id)
        topic = db.get_topic(id=id)

        if topic is None:
            raise HTTPException(status_code=404, detail='Topic not found')

        title = topic['title']

    # get all news from symbols from that date
    proj = {'_id':1, 'headline':1, 'embedding':1}
    all_news = list(db.get_news({'counterparty': counterparty, 'date': date}, projection=proj))
    if not all_news or len(all_news) == 0:
        raise HTTPException(status_code=404, detail='No news found')

    scores = scorer.score([news['embedding'] for news in all_news], title)
    if not scores:
        raise HTTPException(status_code=404, detail='Topic not found')
    
    ret = []
    for i, score in enumerate(scores):
        score = list(score.values())[0]
        if score > sim_threshold:
            ret.append({'_id': str(all_news[i]['_id']), 'headline': all_news[i]['headline'], 'score': score})

    return ret

def gen_topic_embed(topic: TopicCreate):
    # regex: \b(keyword1)\b|\b(keyword2)\b/i
    regex = [f'\\b({x})\\b' for x in topic['keywords']]
    regex = '|'.join(regex)

    # get all news embedding with keywords in headline
    cur = db.get_news({'headline': { '$regex': regex, '$options' : 'i' },
                        'embedding': { '$exists': True } }, 
                        projection={'_id':1, 'headline':1, 'embedding':1})

    embedding = [news['embedding'] for news in list(cur)]
    
    if len(embedding) <= 1:
        logger.debug(f'Topic {topic["title"]} has less than 2 news matches')
        return False

    topic['embedding'] = np.mean(np.array(embedding), axis=0).tolist()

    return topic

@router.post("", status_code=201)
def add_topic(topic: TopicCreate):
    topic = jsonable_encoder(topic)
    topic = gen_topic_embed(topic)
    if topic:
        res = scorer.add_topic(topic)
        if not res:
            raise HTTPException(status_code=400, detail='Topic name already exists')
    else:
        raise HTTPException(status_code=400, detail='Topic embedding not generated')

@router.put("")
def update_topic(topic: Topic):
    topic = jsonable_encoder(topic)
    topic['_id'] = ObjectId(topic['id'])
    del topic['id']
    # scorer.update_topic(topic)

@router.delete("")
def delete_topic(id: str):
    scorer.delete_topic(id)