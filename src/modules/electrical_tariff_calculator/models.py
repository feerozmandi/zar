from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Optional

class TimeOfUseRate(BaseModel):
    """Represents a time-of-use rate."""
    rate: float = Field(..., description="Cost per kWh for this period")
    start_hour: int = Field(..., ge=0, le=23, description="Start hour (0-23) for this rate period")
    end_hour: int = Field(..., ge=0, le=23, description="End hour (0-23) for this rate period")
    days_of_week: List[int] = Field(..., min_items=1, max_items=7, description="Days of week (0=Monday, 6=Sunday) this rate applies")

class EnergyCharge(BaseModel):
    """Represents energy charges, possibly with time-of-use."""
    flat_rate_kwh: Optional[float] = Field(None, description="Flat rate per kWh if no TOU")
    time_of_use_rates: Optional[List[TimeOfUseRate]] = Field(None, description="List of time-of-use rates")

class DemandCharge(BaseModel):
    """Represents demand charges."""
    rate_kw: float = Field(..., description="Cost per kW of peak demand")
    min_demand_kw: Optional[float] = Field(0.0, description="Minimum demand in kW for billing")

class PowerFactorPenalty(BaseModel):
    """Represents power factor penalty rules."""
    threshold: float = Field(0.9, ge=0.0, le=1.0, description="Power factor threshold below which penalties apply")
    penalty_rate: float = Field(..., description="Penalty rate per kVARh or percentage increase")
    penalty_type: Literal["kVARh_rate", "percentage_increase"] = Field(..., description="Type of power factor penalty")

class Tariff(BaseModel):
    """Defines an electricity tariff structure."""
    name: str
    customer_type: Literal["residential", "commercial", "industrial"]
    fixed_charge: float = Field(0.0, description="Monthly fixed charge")
    energy_charges: EnergyCharge
    demand_charges: Optional[DemandCharge] = None
    power_factor_penalty: Optional[PowerFactorPenalty] = None
    tax_rate: float = Field(0.0, ge=0.0, le=1.0, description="Applicable tax rate (e.g., 0.05 for 5%)")

class ConsumptionDataPoint(BaseModel):
    """Represents energy consumption and demand for a specific hour."""
    timestamp: str = Field(..., description="Timestamp of the consumption data (ISO 8601 format)")
    kwh: float = Field(..., ge=0.0, description="Kilowatt-hours consumed during this hour")
    kw_peak: float = Field(..., ge=0.0, description="Peak kilowatt demand during this hour")
    kvarh: Optional[float] = Field(None, ge=0.0, description="Kilovolt-ampere reactive hours consumed during this hour (for power factor calculation)")
    kva_peak: Optional[float] = Field(None, ge=0.0, description="Peak kilovolt-ampere demand during this hour (for power factor calculation)")

class BillAnalysisRequest(BaseModel):
    """Request model for bill analysis."""
    tariff: Tariff
    consumption_data: List[ConsumptionDataPoint]

class CostBreakdown(BaseModel):
    """Detailed breakdown of costs."""
    fixed_charge: float
    energy_charge: float
    demand_charge: float
    power_factor_penalty: float
    subtotal: float
    taxes: float
    total_bill: float

class BillAnalysisResponse(BaseModel):
    """Response model for bill analysis."""
    tariff_name: str
    total_consumption_kwh: float
    peak_demand_kw: float
    cost_breakdown: CostBreakdown
    messages: List[str] = []
