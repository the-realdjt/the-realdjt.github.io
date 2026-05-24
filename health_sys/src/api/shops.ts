export type NearbyShop = {
  distance: string;
  name: string;
  note: string;
};

export async function fetchNearbyShops(position: { latitude: number; longitude: number }): Promise<NearbyShop[]> {
  const params = new URLSearchParams({
    lat: String(position.latitude),
    lng: String(position.longitude)
  });
  const response = await fetch(`/api/nearby-shops?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "附近店铺获取失败");
  }
  if (!Array.isArray(data?.shops)) {
    throw new Error("附近店铺响应格式错误");
  }

  return data.shops;
}
