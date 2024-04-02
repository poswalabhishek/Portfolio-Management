import pandas as pd
from datetime import timedelta
from database import database as db

class AlertGenerator:
    
    def __init__(self):
        self.percentile_cutoff = 0.05
        self.normalizing_percentile_cutoff = 0.1
        pass

    def generate_sentiment_alert(self, counterparty, dates: list, scores: list):
        df = pd.DataFrame(zip(dates, scores), columns=['date', 'score'])
        df['date'] = pd.to_datetime(df['date'])
        
        df['d_score1'] = df['score'].diff()
        df['d_score2'] = df['score'].diff(periods=2)
        df['d_score3'] = df['score'].diff(periods=4)
        df['d_score'] = df[['d_score1', 'd_score2', 'd_score3']].mean(axis=1)
        df.dropna(inplace=True)
        df['score_percentile'] = df['score'].rank(pct=True)
        df['d_score_percentile'] = df['d_score'].rank(pct=True)


        low_percentiles = df[
            (df['d_score_percentile'] < self.percentile_cutoff) &
            (df['score_percentile'] < self.normalizing_percentile_cutoff)
        ]
        high_percentiles = df[
            (df['d_score_percentile'] > 1-self.percentile_cutoff) &
            (df['score_percentile'] > 1-self.normalizing_percentile_cutoff)
        ]

        for _, row in low_percentiles.iterrows():
            db.add_alert({
                'date': row['date'],
                'category': 'alert',
                'counterparty': counterparty,
                'type': 'sentiment drop',
                'value': row['d_score'],
                'percentile': row['d_score_percentile']
            })
        
        for _, row in high_percentiles.iterrows():
            db.add_alert({
                'date': row['date'],
                'category': 'reminder',
                'counterparty': counterparty,
                'type': 'sentiment raise',
                'value': row['d_score'],
                'percentile': 1 - row['d_score_percentile']
            })



alertGenerator = AlertGenerator()