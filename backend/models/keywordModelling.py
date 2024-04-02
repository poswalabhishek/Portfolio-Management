import numpy as np 
# import matplotlib.pyplot as plt
from nltk.corpus import wordnet

keywords = ["Ownership Change", "Change of Control", "Acceleration", "Accelerate", "Default", "Insolvency", "Insolvent", "Delay", \
        "Late", "Failure", "Fail", "Dispute", "Liquidation", "Liquidator", "Margin call", "Haircut", "Bank Run", "Termination", "Moratorium", \
        "Suspension", "Suspend", "Fraud", "Misrepresentation", "Fine", "Sanction", "Breach", "Reschedule", "Restructuring", "Restructure", \
        "Credit Event", "Losses", "Loss", "Bailout", "Bailing", "Bankrupt", "Receivership", "Receiver", "Judicial Management", "Judicial Manager", \
        "Administration", "Administrator", "Sequestrate", "Sequestration", "Support", "Capital call", "Liquidity Event", "Negative trends", \
        "Price changes", "Board Infighting", "Corruption", "Inappropriate or ultra vires dealings", "Negative working capital", "Acquisition", \
        "LBO", "Qualified audit opinion", "Regulatory Breach", "Non-performing Assets", "Provisions", "Force majeure", "Distress", "Frozen", \
        "Delisted", "Sued", "Suit", "Arrested", "Disappeared", "Uncontactable"]

def keyword_count (news):
    
    keywords_count_dict = {}
    
    for keyword in keywords:
        keyword = keyword.lower()
        news = news.lower()
        if keyword in news:
            keywords_count_dict[keyword] = keywords_count_dict.get(keyword, 0) + 1


    
    return keywords_count_dict

# def keyword_count (news):
    
#     keywords_count_dict = {}
    
#     for keyword in keywords:
#         keyword = keyword.lower()
#         news = news.lower()
#         synonyms = set()
#         for syn in wordnet.synsets(keyword):
#             for l in syn.lemmas():
#                 synonyms.add(l.name())
#         for keyword_synonym in synonyms:
#             keyword_synonym = keyword_synonym.lower()
#             if keyword_synonym in news:
#                 keywords_count_dict[keyword] = keywords_count_dict.get(keyword, 0) + 1


    
#     return keywords_count_dict