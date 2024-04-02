from pytorch_pretrained_bert import BertTokenizer
from pytorch_pretrained_bert.tokenization import VOCAB_NAME
from models.bertModel import BertClassification
from typing import List
import torch
from typing import List
import time
import torch.nn.functional as F

class modelInfer:
    def __init__(self, config, news:List[dict] = []):
        self.labels = config.labels
        self.vocab = config.vocab
        self.vocab_path = config.vocab_path
        self.pretrained_weights_path = config.pretrained_weights_path
        self.fine_tuned_weight_path = config.fine_tuned_weight_path
        self.max_seq_length = config.max_seq_length
        self.model = BertClassification(weight_path= config.pretrained_weights_path, num_labels=len(self.labels), vocab=self.vocab)
        self.news = news
        self.device = config.device
        self.model.load_state_dict(torch.load(self.fine_tuned_weight_path, map_location=self.device))
        self.model.to(self.device)
    
    def set_news(self, news:List[dict]):
        self.news = news

    def infer(self):
        id_loop = [data['_id'] for data in self.news]
        sentences = [data['headline'] for data in self.news]
        tokenizer = BertTokenizer(vocab_file = self.vocab_path, do_lower_case = True, do_basic_tokenize = True)
        self.model.eval()
        result_list = []
        for id, sent in zip(id_loop,sentences): 
            tokenized_sent = tokenizer.tokenize(sent)
            if len(tokenized_sent) > self.max_seq_length:
                tokenized_sent = tokenized_sent[:self.max_seq_length]
            
            ids_review  = tokenizer.convert_tokens_to_ids(tokenized_sent)
            mask_input = [1]*len(ids_review)        
            padding = [0] * (self.max_seq_length - len(ids_review))
            ids_review += padding
            mask_input += padding
            input_type = [0]*self.max_seq_length
            
            input_ids = torch.tensor(ids_review).to(self.device).reshape(-1, self.max_seq_length)
            attention_mask =  torch.tensor(mask_input).to(self.device).reshape(-1, self.max_seq_length)
            token_type_ids = torch.tensor(input_type).to(self.device).reshape(-1, self.max_seq_length)
            with torch.set_grad_enabled(False):
                outputs = self.model(input_ids, token_type_ids, attention_mask)
                outputs = F.softmax(outputs,dim=1)
                sentiment_score = 0
                if self.labels[torch.argmax(outputs).item()]=="positive":
                    sentiment_score = 1
                elif self.labels[torch.argmax(outputs).item()]=="neutral":
                    sentiment_score = 0
                elif self.labels[torch.argmax(outputs).item()]=="negative":
                    sentiment_score = -1
                result_list.append({"_id":id, "sentiment":sentiment_score})
        return result_list