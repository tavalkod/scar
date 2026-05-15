import ReactECharts from "echarts-for-react";
import { useState } from "react";
import { useLiveQuery, } from "@electric-sql/pglite-react";

import { legend } from "./legend";



export function BigPicture() {

function formatTime(seconds: number) {
    seconds = Math.floor(seconds / 1.4)
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}


    const data = useLiveQuery.sql`
with data as (
    select 
        p.name,
        s.replay_id,
        s.frame as frame,
        s.workers_active_count as cnt
    from
        player_stats_events s
    join players p
        on s.replay_id = p.replay_id and s.player_id = p.player_id
    where p.name = 'Tavalkod'
)
--select * from data
select 'line' as type, 'none' as symbol, array_agg(Array[frame/16, cnt] ORDER BY frame) as data 
from data
group by replay_id

`?.rows;
    if (!data) return null;

    console.log(data)
    return <ReactECharts
        option={{
            xAxis: { type: "value", axisLabel: { formatter: formatTime } },
            yAxis: [{ name: "drones" }],
            dataZoom: [{}],
            legend: legend,

            tooltip: {
            },
            series: data
        }}
        style={{ height: 700 }}
    />;

}