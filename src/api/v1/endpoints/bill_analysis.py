from fastapi import APIRouter, HTTPException, status
from typing import List

from src.modules.electrical_tariff_calculator.models import BillAnalysisRequest, BillAnalysisResponse
from src.modules.electrical_tariff_calculator.calculator import ElectricalBillCalculator

router = APIRouter()
calculator = ElectricalBillCalculator()

@router.post(
    "/bill-analysis",
    response_model=BillAnalysisResponse,
    summary="Analyze electricity bill based on tariff and consumption data",
    description="Calculates detailed electricity costs including fixed charges, energy charges (flat or time-of-use), demand charges, and power factor penalties.",
    response_description="Detailed breakdown of electricity costs and total bill.",
)
async def analyze_bill(request: BillAnalysisRequest):
    """
    Endpoint to calculate electricity bill.

    Accepts a tariff structure and a list of consumption data points,
    then returns a detailed cost breakdown.
    """
    try:
        response = calculator.calculate_bill(request.tariff, request.consumption_data)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during bill calculation: {str(e)}"
        )
