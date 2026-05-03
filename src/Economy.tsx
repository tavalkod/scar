import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { useLiveQuery, usePGlite } from "@electric-sql/pglite-react";
import type { EChartsOption, SeriesOption } from "echarts";
import { raw } from "@electric-sql/pglite/template";
import { legend } from "./legend";



export default function Economy() {
    const income = useLiveQuery.sql<any>`
select 
    'line' as type,     
    pid as name, 
    array_agg(Array[frame, minerals_collection_rate] ORDER BY frame) as data
from player_stats_events 
group by pid;
`?.rows;


    const option = {
        xAxis: { type: "category", axisLabel: { formatter: formatFrame } },
        yAxis: {},
        dataZoom: [{}],
        legend: legend,

        tooltip: {
        },
        series:
            income
    };

    return (<>
        <ReactECharts option={option} style={{ height: 700 }} />
    </>
    );

    function useAggSelector() {
        const [selectedAggregation, setSelectedAggregation] = useState('supply'); 
        console.log(selectedAggregation)

        // ...
        const dropdown = (
            <select
                value={selectedAggregation}
                onChange={e => setSelectedAggregation(e.target.value)}
            >
                <option value="sc2_unit_types.supply">Supply</option>
                <option value="sc2_unit_types.minerals">Minerals</option>
                <option value="sc2_unit_types.vespene">Vespene</option>
                <option value="sc2_unit_types.minerals + sc2_unit_types.vespene">Resources</option>
                <option value="1">Count</option>
            </select>
        );

        return { selectedAggregation, dropdown };
    }
}
function formatFrame(frame: any) {
    const totalS = Math.floor(frame / 24 / 1.4);
    const s = Math.floor(totalS % 60).toFixed(0).padStart(2, "0");
    const m = Math.floor(totalS / 60).toFixed(0).padStart(2, "0");
    const time = `${m}:${s}`;
    return time;
}

