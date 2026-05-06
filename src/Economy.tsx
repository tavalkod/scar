import ReactECharts from "echarts-for-react";
import { useLiveQuery } from "@electric-sql/pglite-react";
import { legend } from "./legend";



export default function Economy() {
    const income = useLiveQuery.sql<any>`
select 
    'line' as type,    
    'none' as symbol, 
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
    'none' as symbol,
    pid || ' filtered' as name,
    array_agg(Array[frame, minerals_collection_rate] ORDER BY frame) as data
from T
group by pid;
`?.rows;

    const economySpending = useLiveQuery.sql<any>`
with born AS (
    select 
        (frame / (16*15 )) * (16*15) as frame,
        upkeep_pid as pid, 
        unit_type_name
    from sc2_events where 
        event_name IN ('UnitBornEvent', 'UnitInitEvent')
        AND unit_type_name in ('Drone', 'SCV', 'Probe', 'Hatchery', 'Nexus', 'CommandCenter')
        AND frame != 0
),
cost AS (
    select 
        frame,
        pid,
        SUM(minerals) as minerals
    from born
    join sc2_unit_types
        on sc2_unit_types.str_id = born.unit_type_name
    group by frame, pid
)
select
    'line' as type,
    'end' as step,
    pid || ' spent' as name,
    array_agg(Array[frame, minerals] ORDER BY frame) as data
from cost
group by pid
`?.rows;

const economyGrowth = useLiveQuery.sql<any>`

with

filtered as (select
    P1.frame,
    P1.pid, 
    SUM(P2.minerals_collection_rate) / Count(P2.minerals_collection_rate) as minerals_collection_rate
from player_stats_events P1 
join player_stats_events P2
    on P1.pid = P2.pid and P1.frame between P2.frame - 16*60 and P2.frame + 16*60
group by P1.pid, P1.frame
),
ranked as (
select    
    pid,
    frame,
    minerals_collection_rate,
    rank() over (partition by pid order by frame) as rnk
from filtered 
)
select
    'line' as type,
    R1.pid as name,
    array_agg(Array[R1.frame, R2.minerals_collection_rate - R1.minerals_collection_rate] ORDER BY R1.frame) as data
from
    ranked R1
    inner join ranked R2
        on R1.pid = R2.pid and R1.rnk + 4 = R2.rnk
group by R1.pid
`?.rows;

    console.log(economySpending)

    if (!income || !filteredIncome) return null;

    return (<>
        <ReactECharts
            option={{
                xAxis: { type: "value", axisLabel: { formatter: formatFrame } },
                yAxis: [{ name: "mining" }],
                dataZoom: [{}],
                legend: legend,

                tooltip: {
                },
                series: [
                    ...income,
                    ...filteredIncome,
                ]
            }}
            style={{ height: 700 }}
        />
        <ReactECharts
            option={{
                xAxis: { type: "value", axisLabel: { formatter: formatFrame } },
                yAxis: [{ name: "spending" }, { name: "growth" }],
                dataZoom: [{}],
                legend: legend,

                tooltip: {
                },
                series: [
                    ...economySpending,
                    ...economyGrowth
                ]
            }}
            style={{ height: 700 }}
        />
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

