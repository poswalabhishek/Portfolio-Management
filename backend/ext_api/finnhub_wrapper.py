import logging
import time
from datetime import datetime, timedelta

import finnhub
import pandas as pd
import secret_keys

logger = logging.getLogger(__name__)

finnhub_client = finnhub.Client(api_key=secret_keys.finnhub_api_key)

def try_again_if_error(func, max_attempts=2):
    def decorate(*args, **kwargs):
       for attempts in range(max_attempts+1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempts == max_attempts:
                    raise(e)
    return decorate

def fetch_historical_stock_news(symbol, start_date = None):

    news = []
    new_news = None
    if start_date is None:
        start_date = datetime.utcnow().date() - timedelta(days=366) #finnhub free tier provide one year historical news
    else:
        start_date = start_date.date()

    while new_news != []:

        if news == []:
            end_date = datetime.utcnow().date() #today
        else:
            end_date = min(
                end_date - timedelta(days=1),
                datetime.utcfromtimestamp(news[-1]['datetime']).date()
            )

        time.sleep(1)
        
        new_news = try_again_if_error(finnhub_client.company_news)(
            symbol, _from=start_date.isoformat(), to=end_date.isoformat()
        )
        news += new_news
    
    if not news:
        return []   #skip if no news found

    news_df = pd.DataFrame(news).drop_duplicates(subset=['datetime', 'headline', 'source'])
    news_df['api'] = 'Finnhub'
    news_df['counterparty'] = symbol

    news_df\
        .drop(columns=['category', 'id', 'related'], inplace=True, errors="ignore") # drop column if exist

    news_df['date'] = pd.to_datetime(news_df['datetime'], unit="s").dt.strftime("%Y-%m-%d") # add datestring

    return news_df.to_dict('records')