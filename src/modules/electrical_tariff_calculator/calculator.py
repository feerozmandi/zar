from datetime import datetime
from typing import List, Dict, Tuple, Optional
from src.modules.electrical_tariff_calculator.models import (
    Tariff,
    ConsumptionDataPoint,
    CostBreakdown,
    BillAnalysisResponse,
    EnergyCharge,
    DemandCharge,
    PowerFactorPenalty,
    TimeOfUseRate
)

class ElectricalBillCalculator:
    """
    Calculates electricity bills based on a given tariff and consumption data.
    Supports fixed charges, energy charges (flat and time-of-use), demand charges,
    and power factor penalties.
    """

    def calculate_bill(self, tariff: Tariff, consumption_data: List[ConsumptionDataPoint]) -> BillAnalysisResponse:
        """
        Calculates the total electricity bill and provides a detailed breakdown.
        """
        messages = []

        fixed_charge_cost = tariff.fixed_charge
        energy_charge_cost, total_consumption_kwh = self._calculate_energy_charge(tariff.energy_charges, consumption_data)
        demand_charge_cost, peak_demand_kw = self._calculate_demand_charge(tariff.demand_charges, consumption_data, messages)
        power_factor_penalty_cost = self._calculate_power_factor_penalty(tariff.power_factor_penalty, consumption_data, messages)

        subtotal = fixed_charge_cost + energy_charge_cost + demand_charge_cost + power_factor_penalty_cost
        taxes = subtotal * tariff.tax_rate
        total_bill = subtotal + taxes

        cost_breakdown = CostBreakdown(
            fixed_charge=fixed_charge_cost,
            energy_charge=energy_charge_cost,
            demand_charge=demand_charge_cost,
            power_factor_penalty=power_factor_penalty_cost,
            subtotal=subtotal,
            taxes=taxes,
            total_bill=total_bill
        )

        return BillAnalysisResponse(
            tariff_name=tariff.name,
            total_consumption_kwh=total_consumption_kwh,
            peak_demand_kw=peak_demand_kw,
            cost_breakdown=cost_breakdown,
            messages=messages
        )

    def _calculate_energy_charge(self, energy_charges: EnergyCharge, consumption_data: List[ConsumptionDataPoint]) -> Tuple[float, float]:
        """Calculates energy charges based on consumption data."""
        total_kwh = sum(dp.kwh for dp in consumption_data)
        energy_cost = 0.0

        if energy_charges.flat_rate_kwh is not None:
            energy_cost = total_kwh * energy_charges.flat_rate_kwh
        elif energy_charges.time_of_use_rates:
            energy_cost = self._calculate_tou_energy_charge(energy_charges.time_of_use_rates, consumption_data)
        
        return energy_cost, total_kwh

    def _calculate_tou_energy_charge(self, tou_rates: List[TimeOfUseRate], consumption_data: List[ConsumptionDataPoint]) -> float:
        """Calculates energy charges for time-of-use rates."""
        tou_cost = 0.0
        for dp in consumption_data:
            dt_object = datetime.fromisoformat(dp.timestamp)
            hour = dt_object.hour
            day_of_week = dt_object.weekday() # Monday is 0, Sunday is 6

            for rate_period in tou_rates:
                if day_of_week in rate_period.days_of_week:
                    if rate_period.start_hour <= rate_period.end_hour: # Rates within the same day
                        if rate_period.start_hour <= hour < rate_period.end_hour:
                            tou_cost += dp.kwh * rate_period.rate
                            break
                    else: # Rates spanning midnight (e.g., 22-6)
                        if (rate_period.start_hour <= hour) or (hour < rate_period.end_hour):
                            tou_cost += dp.kwh * rate_period.rate
                            break
            # If no TOU rate matches, assume a default or unbilled, or raise an error.
            # For simplicity, we'll assume unmatched hours are not charged in this model.
            # A more robust system might have a default rate.
        return tou_cost

    def _calculate_demand_charge(self, demand_charges: Optional[DemandCharge], consumption_data: List[ConsumptionDataPoint], messages: List[str]) -> Tuple[float, float]:
        """Calculates demand charges."""
        if not demand_charges:
            return 0.0, 0.0

        peak_demand_kw = 0.0
        if consumption_data:
            peak_demand_kw = max(dp.kw_peak for dp in consumption_data)

        billed_demand_kw = max(peak_demand_kw, demand_charges.min_demand_kw or 0.0)

        demand_cost = billed_demand_kw * demand_charges.rate_kw
        
        if billed_demand_kw > peak_demand_kw:
            messages.append(f"Demand charge applied based on minimum demand of {demand_charges.min_demand_kw} kW, even though actual peak was {peak_demand_kw} kW.")

        return demand_cost, peak_demand_kw

    def _calculate_power_factor_penalty(self, pf_penalty: Optional[PowerFactorPenalty], consumption_data: List[ConsumptionDataPoint], messages: List[str]) -> float:
        """Calculates power factor penalties."""
        if not pf_penalty:
            return 0.0

        total_kwh = sum(dp.kwh for dp in consumption_data)
        total_kvarh = sum(dp.kvarh for dp in consumption_data if dp.kvarh is not None)
        total_kva_peak = sum(dp.kva_peak for dp in consumption_data if dp.kva_peak is not None)

        if total_kwh == 0:
            return 0.0 # No consumption, no penalty

        # Option 1: Calculate average power factor from total kWh and kVARh
        # This assumes kVARh data is available per interval.
        if total_kvarh > 0 and total_kwh > 0:
            # Approximate average power factor for the period
            power_factor = total_kwh / (total_kwh**2 + total_kvarh**2)**0.5
            if power_factor < pf_penalty.threshold:
                if pf_penalty.penalty_type == "kVARh_rate":
                    # This calculation is simplified. A real penalty might only charge
                    # for kVARh exceeding a certain power factor.
                    # For simplicity, if PF is below threshold, apply penalty on total kVARh.
                    penalty = total_kvarh * pf_penalty.penalty_rate
                    messages.append(f"Power factor ({power_factor:.2f}) below threshold ({pf_penalty.threshold:.2f}). kVARh penalty applied.")
                    return penalty
                elif pf_penalty.penalty_type == "percentage_increase":
                    # This would require knowing the base cost before penalty.
                    # For now, it's a placeholder. A more complex implementation would
                    # take the total energy+demand cost and apply a percentage.
                    # As a simplified example, apply on total KWH for this module.
                    # In a full system, this would modify the subtotal.
                    # Let's return 0 here and indicate that this penalty type needs more context.
                    messages.append(f"Power factor ({power_factor:.2f}) below threshold ({pf_penalty.threshold:.2f}). Percentage increase penalty type not fully implemented in this module, requires total bill context.")
                    return 0.0
        
        # Option 2: Calculate power factor from peak kW and kVA
        # This is more complex and usually applies to peak demand periods.
        # For simplicity, we only consider the average power factor for the total period.

        return 0.0
