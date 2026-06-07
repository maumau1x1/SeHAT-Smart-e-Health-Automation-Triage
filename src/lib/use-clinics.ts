import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Clinic } from "./clinics-helpers";

export function useClinics() {
  return useQuery<Clinic[]>({
    queryKey: ["clinics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        distance: c.distance,
        queue: c.queue,
        wait: c.wait,
        crowd: c.crowd as Clinic["crowd"],
        bestTime: c.best_time,
        lat: c.lat,
        lng: c.lng,
      }));
    },
  });
}