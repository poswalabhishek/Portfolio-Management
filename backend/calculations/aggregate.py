from database import database as db
from calculations.alertGenerator import alertGenerator
from itertools import chain

def weighted_rolling_average(avgs: list, weights: list, decay=0.8):

    r_avgs = []
    r_weights = []

    for avg, weight in zip(avgs, weights):
        if len(r_avgs) == 0:
            prev_r_weight = 0
            prev_r_avg = 0
        else:
            prev_r_weight = r_weights[-1]
            prev_r_avg = r_avgs[-1]
        
        r_weight = decay * prev_r_weight + weight
        r_avg = (decay * prev_r_weight * prev_r_avg + avg * weight)/(r_weight or 1)

        r_avgs.append(r_avg)
        r_weights.append(r_weight)

    return (r_avgs, r_weights)

def aggregate_sentiments_daily():
    
    counterparties = [ 
        c['symbol'] for c in db.database['counterparty'].find(projection=['symbol'])
    ]
    pipeline = [
        { '$match': {'counterparty': {'$in': counterparties}, 'sentiment': {'$exists': True}}},
        {'$group': {'_id': { 'date': '$date', 'counterparty': '$counterparty', 'sentiment': '$sentiment'}, 'count':{'$sum':1}}},
        {'$group': {'_id': {'date':'$_id.date', 'counterparty':'$_id.counterparty'}, 'news_count': {'$sum': '$count'}, 'sentiments': {'$addToSet' : {'k': {'$toString': '$_id.sentiment'}, 'v':'$count'}}}},
        {'$project': {'_id': 0, 'date':'$_id.date', 'counterparty':'$_id.counterparty', 'news_count': 1, 'sentiments': {'$arrayToObject': '$sentiments'} }},
        {'$group': {'_id': '$counterparty', 'results': {'$push': {'date': '$date', 'news_count': '$news_count', 'sentiments': '$sentiments'}}}},
        {'$project':{'_id': 0, 'counterparty': '$_id', 'results': 1}}
    ]

    aggregated = db.aggregate_news(pipeline)

    output = []
    for a in aggregated:
        results = sorted(a['results'], key= lambda x: x['date'])

        weights = [
            r['sentiments'].get('1', 0) + r['sentiments'].get('-1', 0) + 0.25 * r['sentiments'].get('0', 0)
        for r in results]
        avgs = [
            (r['sentiments'].get('1', 0) - r['sentiments'].get('-1', 0))/w
        for r, w in zip(results, weights)]
        r_avgs, r_weights = weighted_rolling_average(avgs, weights)

        alertGenerator.generate_sentiment_alert(a['counterparty'], [r['date'] for r in results], r_avgs)
        
        for r, r_avg, r_weight in zip(results, r_avgs, r_weights):
            r['sentiments']['rolling_avg'] = r_avg
            r['sentiments']['rolling_weight'] = r_weight
            r['counterparty'] = a['counterparty']
            output.append(r)

    return output


def aggregate_topic_count_daily():
    sim_threshold = 0.7

    topics = list(db.database['topic'].find(projection={'title': 1}))
    counterparties = [ 
        c['symbol'] for c in db.database['counterparty'].find(projection=['symbol'])
    ]
    
    queries = []
    
    for counterparty in counterparties:
        queries.append(db.database['news'].aggregate([
            { '$match': {'counterparty': counterparty, 'topic_scores': {'$exists': True}}},
            {'$project': 
                { 'date': 1,
                    'topic_count': { 
                        t['title']: { '$cond': [{'$gt': [f"$topic_scores.{t['title']}", sim_threshold]}, 1 , '$$REMOVE']} for t in topics 
                    } 
                }
            },
            {'$addFields': {'topics': {'$objectToArray': '$topic_count'}} },
            { '$unwind': '$topics'},
            { '$group': {
                '_id': {
                    'date': '$date',
                    'k': "$topics.k"
                },
                'v': {'$sum': '$topics.v'},
            } },
            { '$group': {
                '_id': '$_id.date',
                'topics': { '$push': {'k': "$_id.k", 'v': "$v"}},
            }},
            { '$project': {
                '_id': 0,
                'counterparty': counterparty,
                'date': '$_id',
                'topic_count': {'$arrayToObject': "$topics"}
            }}

        ]))
    return chain(*queries)


# def aggregate_keywords_news_count_daily():

#     counterparties = [ 
#         c['symbol'] for c in db.database['counterparty'].find(projection=['symbol'])
#     ]
#     pipeline = [
#         { '$match': {'counterparty': {'$in': counterparties}, 'sentiment': {'$exists': True}}},
#         { '$addFields': {'keywords': {'$objectToArray': '$keyword_count'}} },
#         { '$unwind': '$keywords'},
#         { '$group': {
#             '_id': {
#                 'counterparty': '$counterparty',
#                 'date': '$date',
#                 'k': "$keywords.k"
#             },
#             'v': {'$sum': 1},
#         } },
#         { '$group': {
#             '_id': {
#                 'counterparty': '$_id.counterparty',
#                 'date': '$_id.date',
#             },
#             'keywords': { '$push': {'k': "$_id.k", 'v': "$v"}},
#         }},
#         { '$project': {
#             '_id': 0,
#             'counterparty': '$_id.counterparty',
#             'date': '$_id.date',
#             'keyword_count': {'$arrayToObject': "$keywords"}
#         }}
#     ]

#     return db.aggregate_news(pipeline)
