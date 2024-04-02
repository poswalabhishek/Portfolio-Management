from pydantic import BaseModel
from typing import Union, List

class TopicBase(BaseModel):
    title: str
    keywords: List[str]
    counterparties: Union[List[str], str]

class TopicCreate(TopicBase):
    pass

class Topic(TopicBase):
    id: str