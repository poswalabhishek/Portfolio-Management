from typing import List

import numpy as np
from transformers import BertForSequenceClassification, BertTokenizer

import utils
from calculations.topicScorer import topicScorer

class transformerInfer:
    def __init__(self, config, topicScorer: topicScorer, news: List[dict] = None):
        self.news = news if news != None else []

        self.labels = config.labels
        self.max_token_len = config.max_seq_length
        self.batch_size = config.batch_size
        self.device = config.device

        self.class2sent_map = {0: 0, 1: 1, 2: -1}

        self.tokenizer = BertTokenizer.from_pretrained('yiyanghkust/finbert-tone')
        self.model = BertForSequenceClassification.from_pretrained('yiyanghkust/finbert-tone', num_labels=3).to(self.device)

        self.topicScorer = topicScorer
    
    '''
    Must use before using infer()
    Parameters:
        news: list of dicts, each dict has keys '_id' and 'headline'
    '''
    def set_news(self, news: List[dict]) -> None:
        self.news = news

    def __tokenize(self, sentences):
        return self.tokenizer(sentences, return_tensors="pt", max_length=self.max_token_len , padding='max_length', truncation=True).to(self.device)

    '''
    Infers all the news set in set_news()
    Returns: list of dicts, each dict contains _id, sentiment (from -1 to 1) and ~topic_scores
    '''
    def infer(self) -> List[dict]:
        result_list = []

        #inference loop, processing batch_size sentences at a time
        for news in utils.chunks(self.news, self.batch_size):
            sentences = [data['headline'] for data in news]
            
            inputs = self.__tokenize(sentences)
            outputs = self.model(**inputs, output_hidden_states=True)

            # 1d array of batch_size, each classified from 0 to 2
            classifications = np.argmax(outputs[0].detach().cpu().numpy(), axis=1)
            
            # extract and reshape last layer
            last_layer = outputs.hidden_states[-1].detach().cpu().numpy() #(batch_size, max_token_len, 768)
            last_layer = last_layer.reshape(last_layer.shape[0], -1) #(batch_size, max_token_len*768)

            # avg embedding (from word-based to sentence)
            embeddings = np.mean(last_layer.reshape(last_layer.shape[0], 768, -1), axis=2) #(batch_size, 768)
            topic_scores = self.topicScorer.score(embeddings)

            sent = lambda i: self.class2sent_map[classifications[i]]
            result_list += [{'_id': data['_id'],
                            'v2': True,
                            'sentiment': sent(i), 
                            'topic_scores': topic_scores[i],
                            'embedding': embeddings[i].tolist()
                            } for i, data in enumerate(news)]
        
        return result_list
