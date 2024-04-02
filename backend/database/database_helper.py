from pymongo import UpdateOne


'''
Do nothing if exist
'''
def InsertIfNotExist(document, keys):
    filter = { key: document[key] for key in keys }
    return UpdateOne(
        filter, 
        {'$setOnInsert': document},
        upsert=True
    )


'''
insert if not exist, update if exist
'''
def UpsertOne(document, keys):
    filter = { key: document[key] for key in keys }
    return UpdateOne(
        filter,
        {'$set': document},
        upsert=True
    )