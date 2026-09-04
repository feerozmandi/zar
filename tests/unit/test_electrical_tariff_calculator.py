import pytest
from datetime import datetime, timedelta
from src.modules.electrical_tariff_calculator.models import (
    Tariff,
    EnergyCharge,
    DemandCharge,
    PowerFactorPenalty,
    TimeOfUseRate,
    ConsumptionDataPoint,
    BillAnalysisRequest,
    BillAnalysisResponse
)
from src.modules.electrical_tariff_calculator.calculator import ElectricalBillCalculator

@pytest.fixture
def calculator():
    return ElectricalBillCalculator()

@pytest.fixture
def basic_tariff():
    return Tariff(
        name="Basic Residential",
        customer_type="residential",
        fixed_charge=10.0,
        energy_charges=EnergyCharge(flat_rate_kwh=0.15),
        tax_rate=0.05
    )

@pytest.fixture
def tou_tariff():
    return Tariff(
        name="TOU Commercial",
        customer_type="commercial",
        fixed_charge=50.0,
        energy_charges=EnergyCharge(
            time_of_use_rates=[
                TimeOfUseRate(rate=0.25, start_hour=8, end_hour=18, days_of_week=[0, 1, 2, 3, 4]), # Peak Mon-Fri
                TimeOfUseRate(rate=0.10, start_hour=18, end_hour=8, days_of_week=[0, 1, 2, 3, 4]), # Off-peak Mon-Fri (wraps around)
                TimeOfUseRate(rate=0.10, start_hour=0, end_hour=24, days_of_week=[5, 6]), # Weekend flat rate
            ]
        ),
        demand_charges=DemandCharge(rate_kw=5.0, min_demand_kw=10.0),
        power_factor_penalty=PowerFactorPenalty(threshold=0.9, penalty_rate=0.5, penalty_type="kVARh_rate"),
        tax_rate=0.08
    )

@pytest.fixture
def consumption_data_flat():
    start_time = datetime(2023, 1, 1, 0, 0, 0)
    data = []
    for i in range(24 * 30): # 30 days of hourly data
        data.append(ConsumptionDataPoint(
            timestamp=(start_time + timedelta(hours=i)).isoformat(),
            kwh=5.0,
            kw_peak=2.0
        ))
    return data

@pytest.fixture
def consumption_data_tou():
    # Simulate peak/off-peak consumption for 1 day (Monday)
    start_time = datetime(2023, 1, 2, 0, 0, 0) # Monday
    data = []
    for i in range(24):
        hour = (start_time + timedelta(hours=i)).hour
        kwh_val = 0.0
        kw_peak_val = 0.0
        kvarh_val = 0.0
        kva_peak_val = 0.0

        if 8 <= hour < 18: # Peak hours (Mon-Fri)
            kwh_val = 10.0
            kw_peak_val = 5.0
            kvarh_val = 3.0 # For PF calculation
            kva_peak_val = 6.0 # For PF calculation
        else: # Off-peak hours
            kwh_val = 3.0
            kw_peak_val = 1.5
            kvarh_val = 0.5
            kva_peak_val = 1.6
        
        data.append(ConsumptionDataPoint(
            timestamp=(start_time + timedelta(hours=i)).isoformat(),
            kwh=kwh_val,
            kw_peak=kw_peak_val,
            kvarh=kvarh_val,
            kva_peak=kva_peak_val
        ))
    
    # Add data for a weekend day (Saturday)
    start_time_sat = datetime(2023, 1, 7, 0, 0, 0) # Saturday
    for i in range(24):
        data.append(ConsumptionDataPoint(
            timestamp=(start_time_sat + timedelta(hours=i)).isoformat(),
            kwh=4.0,
            kw_peak=2.0,
            kvarh=1.0,
            kva_peak=2.2
        ))
    
    return data


def test_calculate_bill_flat_rate(calculator, basic_tariff, consumption_data_flat):
    response = calculator.calculate_bill(basic_tariff, consumption_data_flat)

    expected_total_kwh = 5.0 * 24 * 30
    expected_energy_cost = expected_total_kwh * 0.15
    expected_fixed_charge = 10.0
    expected_subtotal = expected_fixed_charge + expected_energy_cost
    expected_taxes = expected_subtotal * 0.05
    expected_total_bill = expected_subtotal + expected_taxes

    assert response.tariff_name == "Basic Residential"
    assert response.total_consumption_kwh == pytest.approx(expected_total_kwh)
    assert response.cost_breakdown.fixed_charge == pytest.approx(expected_fixed_charge)
    assert response.cost_breakdown.energy_charge == pytest.approx(expected_energy_cost)
    assert response.cost_breakdown.demand_charge == pytest.approx(0.0)
    assert response.cost_breakdown.power_factor_penalty == pytest.approx(0.0)
    assert response.cost_breakdown.subtotal == pytest.approx(expected_subtotal)
    assert response.cost_breakdown.taxes == pytest.approx(expected_taxes)
    assert response.cost_breakdown.total_bill == pytest.approx(expected_total_bill)
    assert response.peak_demand_kw == pytest.approx(2.0)


def test_calculate_bill_tou_and_demand_and_pf(calculator, tou_tariff, consumption_data_tou):
    response = calculator.calculate_bill(tou_tariff, consumption_data_tou)

    # Expected values for consumption_data_tou (1 Mon, 1 Sat)
    # Monday: 10 peak hours * 10 kWh + 14 off-peak hours * 3 kWh = 100 + 42 = 142 kWh
    # Saturday: 24 hours * 4 kWh = 96 kWh
    expected_total_kwh = 142.0 + 96.0 # Total for 2 days

    # Energy Charge (1 Monday, 1 Saturday)
    # Monday Peak (8-18): 10 hours * 10 kWh * 0.25 = 25.0
    # Monday Off-peak (18-8, wraps): 14 hours * 3 kWh * 0.10 = 4.2
    # Saturday (0-24): 24 hours * 4 kWh * 0.10 = 9.6
    expected_energy_cost = 25.0 + 4.2 + 9.6 # Total energy cost

    # Fixed Charge
    expected_fixed_charge = 50.0

    # Demand Charge
    # Peak demand from data is 5.0 kW (during Mon peak). Min demand is 10.0 kW.
    # Billed demand should be 10.0 kW.
    expected_peak_demand_kw = 5.0 # Actual peak from data
    expected_billed_demand_kw = 10.0 # Billed due to min_demand_kw
    expected_demand_charge = expected_billed_demand_kw * 5.0 # 10.0 kW * $5/kW = $50.0

    # Power Factor Penalty
    # Monday: Total KWH = 142, Total KVARH = (10*3) + (14*0.5) = 30 + 7 = 37
    # Power Factor Mon = 142 / sqrt(142^2 + 37^2) = 142 / sqrt(20164 + 1369) = 142 / sqrt(21533) = 142 / 146.74 = 0.967
    # Saturday: Total KWH = 96, Total KVARH = 24*1 = 24
    # Power Factor Sat = 96 / sqrt(96^2 + 24^2) = 96 / sqrt(9216 + 576) = 96 / sqrt(9792) = 96 / 98.95 = 0.970
    # Both power factors are above the 0.9 threshold. So, no penalty.
    expected_pf_penalty = 0.0

    expected_subtotal = expected_fixed_charge + expected_energy_cost + expected_demand_charge + expected_pf_penalty
    expected_taxes = expected_subtotal * 0.08
    expected_total_bill = expected_subtotal + expected_taxes

    assert response.tariff_name == "TOU Commercial"
    assert response.total_consumption_kwh == pytest.approx(expected_total_kwh)
    assert response.peak_demand_kw == pytest.approx(expected_peak_demand_kw)
    assert response.cost_breakdown.fixed_charge == pytest.approx(expected_fixed_charge)
    assert response.cost_breakdown.energy_charge == pytest.approx(expected_energy_cost)
    assert response.cost_breakdown.demand_charge == pytest.approx(expected_demand_charge)
    assert response.cost_breakdown.power_factor_penalty == pytest.approx(expected_pf_penalty)
    assert response.cost_breakdown.subtotal == pytest.approx(expected_subtotal)
    assert response.cost_breakdown.taxes == pytest.approx(expected_taxes)
    assert response.cost_breakdown.total_bill == pytest.approx(expected_total_bill)
    assert any("minimum demand" in msg for msg in response.messages)


def test_power_factor_penalty_applied(calculator):
    tariff = Tariff(
        name="Industrial with PF Penalty",
        customer_type="industrial",
        fixed_charge=100.0,
        energy_charges=EnergyCharge(flat_rate_kwh=0.10),
        power_factor_penalty=PowerFactorPenalty(threshold=0.95, penalty_rate=0.75, penalty_type="kVARh_rate"),
        tax_rate=0.0
    )
    # Low power factor scenario
    consumption = [
        ConsumptionDataPoint(timestamp="2023-01-01T10:00:00", kwh=100.0, kw_peak=50.0, kvarh=50.0), # PF = 100/sqrt(100^2+50^2) = 100/111.8 = 0.89 < 0.95 threshold
        ConsumptionDataPoint(timestamp="2023-01-01T11:00:00", kwh=100.0, kw_peak=50.0, kvarh=40.0), # PF = 100/sqrt(100^2+40^2) = 100/107.7 = 0.92 < 0.95 threshold
    ]

    response = calculator.calculate_bill(tariff, consumption)

    expected_total_kwh = 200.0
    expected_energy_cost = 200.0 * 0.10
    expected_fixed_charge = 100.0
    
    # Total kVARh for penalty calculation = 50 + 40 = 90
    # Total KWH for PF calc = 200
    # Average PF = 200 / sqrt(200^2 + 90^2) = 200 / sqrt(40000 + 8100) = 200 / sqrt(48100) = 200 / 219.31 = 0.911 < 0.95 threshold
    expected_pf_penalty = 90.0 * 0.75 # 67.5

    expected_subtotal = expected_fixed_charge + expected_energy_cost + expected_pf_penalty
    
    assert response.cost_breakdown.power_factor_penalty == pytest.approx(expected_pf_penalty)
    assert response.cost_breakdown.total_bill == pytest.approx(expected_subtotal)
    assert any("Power factor" in msg and "penalty applied" in msg for msg in response.messages)

def test_no_power_factor_penalty_if_above_threshold(calculator):
    tariff = Tariff(
        name="Industrial No Penalty",
        customer_type="industrial",
        fixed_charge=100.0,
        energy_charges=EnergyCharge(flat_rate_kwh=0.10),
        power_factor_penalty=PowerFactorPenalty(threshold=0.8, penalty_rate=0.75, penalty_type="kVARh_rate"),
        tax_rate=0.0
    )
    # High power factor scenario
    consumption = [
        ConsumptionDataPoint(timestamp="2023-01-01T10:00:00", kwh=100.0, kw_peak=50.0, kvarh=20.0), # PF = 100/sqrt(100^2+20^2) = 100/101.98 = 0.98 > 0.8 threshold
        ConsumptionDataPoint(timestamp="2023-01-01T11:00:00", kwh=100.0, kw_peak=50.0, kvarh=10.0), # PF = 100/sqrt(100^2+10^2) = 100/100.49 = 0.99 > 0.8 threshold
    ]

    response = calculator.calculate_bill(tariff, consumption)
    
    # Total kVARh for penalty calculation = 20 + 10 = 30
    # Total KWH for PF calc = 200
    # Average PF = 200 / sqrt(200^2 + 30^2) = 200 / sqrt(40000 + 900) = 200 / sqrt(40900) = 200 / 202.23 = 0.988 > 0.8 threshold
    
    assert response.cost_breakdown.power_factor_penalty == pytest.approx(0.0)
    assert not any("Power factor" in msg and "penalty applied" in msg for msg in response.messages)

def test_empty_consumption_data(calculator, basic_tariff):
    response = calculator.calculate_bill(basic_tariff, [])
    assert response.total_consumption_kwh == pytest.approx(0.0)
    assert response.peak_demand_kw == pytest.approx(0.0)
    assert response.cost_breakdown.fixed_charge == pytest.approx(10.0)
    assert response.cost_breakdown.energy_charge == pytest.approx(0.0)
    assert response.cost_breakdown.demand_charge == pytest.approx(0.0)
    assert response.cost_breakdown.total_bill == pytest.approx(10.0 * 1.05) # Fixed charge + taxes
    assert not response.messages

def test_demand_charge_below_min_demand(calculator):
    tariff = Tariff(
        name="Commercial with Min Demand",
        customer_type="commercial",
        fixed_charge=0.0,
        energy_charges=EnergyCharge(flat_rate_kwh=0.1),
        demand_charges=DemandCharge(rate_kw=10.0, min_demand_kw=20.0),
        tax_rate=0.0
    )
    consumption = [
        ConsumptionDataPoint(timestamp="2023-01-01T10:00:00", kwh=100.0, kw_peak=15.0), # Actual peak 15kW
    ]

    response = calculator.calculate_bill(tariff, consumption)
    assert response.peak_demand_kw == pytest.approx(15.0)
    assert response.cost_breakdown.demand_charge == pytest.approx(20.0 * 10.0) # Billed at 20kW
    assert any("minimum demand" in msg for msg in response.messages)

def test_demand_charge_above_min_demand(calculator):
    tariff = Tariff(
        name="Commercial with Min Demand",
        customer_type="commercial",
        fixed_charge=0.0,
        energy_charges=EnergyCharge(flat_rate_kwh=0.1),
        demand_charges=DemandCharge(rate_kw=10.0, min_demand_kw=20.0),
        tax_rate=0.0
    )
    consumption = [
        ConsumptionDataPoint(timestamp="2023-01-01T10:00:00", kwh=100.0, kw_peak=25.0), # Actual peak 25kW
    ]

    response = calculator.calculate_bill(tariff, consumption)
    assert response.peak_demand_kw == pytest.approx(25.0)
    assert response.cost_breakdown.demand_charge == pytest.approx(25.0 * 10.0) # Billed at 25kW
    assert not any("minimum demand" in msg for msg in response.messages)
