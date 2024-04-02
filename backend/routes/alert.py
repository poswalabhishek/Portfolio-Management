from xmlrpc.client import boolean
from fastapi import APIRouter
from typing import List
from database import database as db
from schemas.alert import Alert
from datetime import datetime, timedelta
from bson.objectid import ObjectId

router = APIRouter()

@router.get("", response_model=List[Alert], response_model_exclude_none=True)
def get_alerts(counterparty: str = None, date_from: str = None, date_to: str =None, dashboard: bool = False, skip: int = 0, limit: int = 0):
    alert_filter = {}
    
    if counterparty is not None:
        alert_filter['counterparty'] =  counterparty
    
    if (date_from is not None) and (date_to is not None):
        alert_filter['date'] = {
            '$lte': datetime.fromisoformat(date_to),
            '$gte': datetime.fromisoformat(date_from)
        }

    result = []
    counterparties = []

    for alert in db.get_alerts(alert_filter, limit=limit, skip=skip):
        alert['id'] = str(alert['_id'])
        del alert['_id']
        if dashboard:
            if alert['counterparty'] in counterparties:
                continue # only return newest alert for each counterparty for dashboard view
            counterparties.append(alert['counterparty'])
            alert['data'] = next(
                db.get_calculations({'counterparty': alert['counterparty'], 'date': alert['date'].strftime("%Y-%m-%d")}),
                None
            )
            alert['counterparty'] = db.get_counterparty({'symbol': alert['counterparty']})
        result.append(alert)
    
    return result

@router.put("", status_code=201)
def update_alerts(id: str, alert: dict):
    db.database['alert'].find_one_and_update(
        {'_id': ObjectId(id)},
        {'$set': alert}
    )