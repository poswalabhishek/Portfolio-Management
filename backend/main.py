from datetime import datetime
from fastapi import FastAPI
from cron import daily_ingest_external_data_cron, daily_update_calculation_cron
from routes.counterparty import router as CounterpartyRouter
from routes.news import router as NewsRouter
from routes.chart import router as ChartRouter
from routes.lda import router as LdaRouter
from routes.topic import router as TopicRouter
from routes.alert import router as AlertRouter
from routes.overview import router as OverviewRouter
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi.middleware.cors import CORSMiddleware
import coloredlogs

coloredlogs.install(level='INFO', fmt='%(asctime)s %(name)s[%(process)d] %(funcName)s %(levelname)s %(message)s')

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://fdra.efadrin.biz"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Accept", "Content-Type"],
)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to root"}


app.include_router(CounterpartyRouter, tags=["Counterparty"], prefix="/counterparty")
app.include_router(NewsRouter, tags=["News"], prefix="/news")
app.include_router(ChartRouter, tags=["Calculation"], prefix="/chart")
app.include_router(LdaRouter, tags=["LDA"], prefix="/lda")
app.include_router(TopicRouter, tags=["Topic"], prefix="/topic")
app.include_router(AlertRouter, tags=["Alert"], prefix="/alert")
app.include_router(OverviewRouter, tags=["Overview"], prefix="/overview")

scheduler = BackgroundScheduler()
scheduler.add_job(
    daily_ingest_external_data_cron,
    CronTrigger(minute='*')   #trigger 5am (21utc) everyday.
)
scheduler.add_job(
    daily_update_calculation_cron,
    CronTrigger(hour='22'),   #trigger 6am (22utc) everyday.
    #next_run_time=datetime.now()
)

scheduler.start()