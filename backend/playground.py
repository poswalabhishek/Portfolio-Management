
from cron import add_daily_aggregated_calculations
from database import database as db

if __name__ == '__main__':
    add_daily_aggregated_calculations()