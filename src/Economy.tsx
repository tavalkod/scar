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
    const filteredIncome = useLiveQuery.sql<any>`
with T as (select
    P1.frame,
    P1.pid, 
    SUM(P2.minerals_collection_rate) / Count(P2.minerals_collection_rate) as minerals_collection_rate
from player_stats_events P1 
join player_stats_events P2
    on P1.pid = P2.pid and P1.frame between P2.frame - 16*60 and P2.frame + 16*60
group by P1.pid, P1.frame
)
select 
    'line' as type,
    pid || ' filtered' as name,
    array_agg(Array[frame, minerals_collection_rate] ORDER BY frame) as data
from T
group by pid;


`?.rows;

    if (!income || !filteredIncome) return null;

    const option = {
        xAxis: { type: "category", axisLabel: { formatter: formatFrame } },
        yAxis: {},
        dataZoom: [{}],
        legend: legend,

        tooltip: {
        },
        series: [
            ...income,
            ...filteredIncome
        ]
    };

    return (<>
        <ReactECharts option={option} style={{ height: 700 }} />
    </>
    );

}
function formatFrame(frame: any) {
    const totalS = Math.floor(frame / 24 / 1.4);
    const s = Math.floor(totalS % 60).toFixed(0).padStart(2, "0");
    const m = Math.floor(totalS / 60).toFixed(0).padStart(2, "0");
    const time = `${m}:${s}`;
    return time;
}

