from typing import List

from sklearn.metrics.pairwise import cosine_similarity

from database import database as db
from schemas.topic import TopicCreate

class topicScorer:
    def __init__(self):
        self.ids = []
        self.titles = []
        self.embeddings = []

        # fill in the embeddings and titles from db
        filter = { 'embedding': {"$exists": True} }
        entries = { '_id': 1, 'title': 1, 'embedding': 1 }
        for entry in list(db.get_topics(filter=filter, projection=entries)):
            self.ids.append(str(entry['_id']))
            self.titles.append(entry['title'])
            self.embeddings.append(entry['embedding'])

    '''
    Parameters:
        embedding (np.array): (number of sentences, max_token_len*768) embedding of the news articles
        topic_title (str): title of the topic. if None, return all topics

    Returns:
        topic_scores (list): [{topic 1: score, ...} * number of sentences]
    '''
    def score(self, embeddings, topic_title: str = None) -> List[dict]:
        if topic_title:
            if topic_title not in self.titles:
                return False
            
            titles = [topic_title]
            topic_embeds = [self.embeddings[self.titles.index(topic_title)]]
        else:
            titles = self.titles
            topic_embeds = self.embeddings 

        #(number of sentences, number of topics)
        score_mat = cosine_similarity(embeddings, topic_embeds)

        result = []
        for i in range(len(embeddings)):
            result.append(dict(zip(titles, score_mat[i])))

        return result

    '''
    Add topics to backend db as well as to scorer (the intermediary cache object for scoring)
    Returns:
        bool: Success (topic title unique)
    '''
    def add_topic(self, topic: TopicCreate):
        if topic['title'] in self.titles:
            return False

        self.titles.append(topic['title'])
        self.embeddings.append(topic['embedding'])

        db.add_topic(topic)
        return True

    def update_topic(self, id):
        pass
        # db.update_topic(topic)

    def delete_topic(self, id):
        if db.delete_topic(id).acknowledged:
            idx = self.ids.index(id)
            self.ids.pop(idx)
            self.titles.pop(idx)
            self.embeddings.pop(idx)

scorer = topicScorer()
