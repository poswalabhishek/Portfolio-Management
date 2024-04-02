print('begin')

topics = {"Admin Change": ["Administration", "Administrator", "Ownership", "Change of Control", "Restructuring", "Restructure", "Board", "Corruption", "Acquisition"], "Ups & Downs": ["Acceleration", "Accelerate", "Deceleration", "Deceleration", "Price"], "Ups": ["Acceleration", "Accelerate"], "Downs": ["Deceleration", "Deceleration"], "Default": ["Default", "Delay", "Late", "Failure", "Fail", "Suspension", "Suspend", "Termination", "Fraud", "Dispute", "Moratorium", "Bankrupt", "Insolvency",  "Insolvent", "Liquidation", "Liquidator"], "Seizing": ["Bank Run", "Receivership", "Receiver", "Judicial", "Sequestrate", "Sequestration", "LBO", "audit", "Provisions"], "Loss": ["Misrepresentation", "Fine", "Sanction", "Breach", "Reschedule", "Losses", "Loss", "Credit Event", "Bailout", "bailing", "Margin calls", "Haircut", "Support", "Negative",  "Non-performing Assets"], "Law Suits": ["Force majeure", "Distress", "Frozen", "Delisted", "Sued", "Suit", "Arrested", "Disappeared"]}

import requests

for key in topics:
    resp = requests.post('http://localhost:8080/topic', json = {'title': f'{key}', 'keywords': topics[key], 'counterparties': 'global'})
    print('-', key, resp, resp.content)