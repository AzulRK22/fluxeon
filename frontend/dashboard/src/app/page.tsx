"use client";

import { useEffect, useState } from "react";
import FeederTable from "@/components/FeederTable";
import LoadChart from "@/components/LoadChart";

type Feeder = {
  id: string;
  name: string;
  state: number;
  load_kw: number;
};

export default function CommandCentrePage() {
  const [feeders, setFeeders] = useState<Feeder[]>([]);
  const [selectedFeeder, setSelectedFeeder] = useState<Feeder | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeeders = async () => {
      try {
        const res = await fetch("http://localhost:8000/feeders");
        const data = await res.json();
        if (!isMounted) return;

        setFeeders(data);
        if (!selectedFeeder && data.length > 0) {
          setSelectedFeeder(data[0]);
        }
      } catch (error) {
        console.error("Error fetching feeders", error);
      }
    };

    fetchFeeders();
    const interval = setInterval(fetchFeeders, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedFeeder]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 lg:col-span-5">
        <FeederTable
          feeders={feeders}
          selectedFeederId={selectedFeeder?.id ?? null}
          onSelect={setSelectedFeeder}
        />
      </section>
      <section className="col-span-12 lg:col-span-7">
        {selectedFeeder ? (
          <LoadChart feederId={selectedFeeder.id} />
        ) : (
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/70 text-sm text-slate-400">
            Select a feeder to inspect its load profile and risk.
          </div>
        )}
      </section>
    </div>
  );
}
