from fastapi import FastAPI
from src.api.v1.endpoints import bill_analysis

app = FastAPI(
    title="Xennic Energy Analytics API",
    description="API for electrical tariff and bill calculation, and other energy-related analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Include API routers
app.include_router(bill_analysis.router, prefix="/api/v1/calculators", tags=["Calculators"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Xennic Energy Analytics API!"}
