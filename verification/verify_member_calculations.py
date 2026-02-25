
import math

def verify_member_calculations():
    print("--- STARTING MEMBER CALCULATIONS VERIFICATION ---")

    # --- INPUTS ---
    mold_sqft = 1000
    ceiling_ht = 10
    density_rate = 165  # Medium (165 sq ft/gal)
    substrate_mult = 1.0 # Standard

    # NEW PARAMETERS
    surface_condition_mult = 1.2 # Rough / Unfinished
    buffer_mult = 1.10 # 10%

    # --- EXPECTED CALCULATION (GM6000) ---
    # Formula: (Area / Coverage) * Substrate * Attic * Surface * Buffer
    # Note: Attic defaults to 1.0 if not selected

    base_gal = mold_sqft / density_rate # 1000 / 165 = 6.0606
    adjusted_gal = base_gal * substrate_mult * 1.0 * surface_condition_mult # * 1.0 * 1.0 * 1.2
    final_gal = adjusted_gal * buffer_mult # * 1.10

    # Rounding Logic (from code: Math.ceil(finalGal / 0.25) * 0.25)
    stock_use = math.ceil(final_gal / 0.25) * 0.25

    print(f"INPUTS: Mold={mold_sqft}, Density={density_rate}, Surf={surface_condition_mult}, Buff={buffer_mult}")
    print(f"CALC: Base={base_gal:.4f}, Adj={adjusted_gal:.4f}, Final={final_gal:.4f}")
    print(f"STOCK USE (Expected): {stock_use:.2f} Gal")

    # --- COST CALCULATION (GM6000) ---
    # Price: $58.70 per RTU Gallon (Exact usage, not stock?)
    # Code: const gm6Cost = finalGal * gm6000Price;
    gm6000_price = 58.70
    expected_gm6_cost = final_gal * gm6000_price
    print(f"GM6000 COST (Expected): ${expected_gm6_cost:.2f}")

    # --- FOGGING CALCULATION ---
    # Sync Logic: Fogging Area = Mold Footprint (1000)
    fog_sqft = 1000
    cubic_ft = fog_sqft * ceiling_ht # 10000

    # Agent: GM 2000
    # Price: $0.00343 per cu ft
    fog_price_per_cuft = 0.00343
    expected_fog_cost = cubic_ft * fog_price_per_cuft

    print(f"FOG INPUTS: Cubic={cubic_ft}, PriceRate={fog_price_per_cuft}")
    print(f"FOG COST (Expected): ${expected_fog_cost:.2f}")

    # --- TOTAL COGS ---
    total_cogs = expected_gm6_cost + expected_fog_cost
    print(f"TOTAL PRODUCT COGS (Expected): ${total_cogs:.2f}")

    return True

if __name__ == "__main__":
    verify_member_calculations()
