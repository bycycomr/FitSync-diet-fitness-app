export interface ScannedFood {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Open Food Facts API'sinden barkod ile besin bilgisi çeker.
 * Ücretsiz, API key gerektirmez.
 */
export async function scanBarcode(barcode: string): Promise<ScannedFood | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments`,
      { signal: AbortSignal.timeout(8000) },
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};

    // Besin değerleri 100g başına — porsiyon bilgisi yoksa 100g baz alınır
    const servingSize = n['serving_size'] ? parseFloat(n['serving_size']) : 100;
    const factor = isNaN(servingSize) || servingSize <= 0 ? 1 : servingSize / 100;

    const perHundred = (key: string): number => {
      const v = parseFloat(n[key] ?? n[`${key}_100g`] ?? '0');
      return isNaN(v) ? 0 : Math.round(v * factor * 10) / 10;
    };

    const calories = perHundred('energy-kcal') || perHundred('energy-kcal_100g');

    return {
      name: p.product_name || 'Bilinmeyen Ürün',
      calories: Math.round(calories),
      protein: perHundred('proteins'),
      carbs: perHundred('carbohydrates'),
      fat: perHundred('fat'),
    };
  } catch {
    return null;
  }
}
