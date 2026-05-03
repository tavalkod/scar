import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { useLiveQuery, usePGlite } from "@electric-sql/pglite-react";
import type { EChartsOption, SeriesOption } from "echarts";
import { raw } from "@electric-sql/pglite/template";
import { legend } from "./legend";


type UnitCompRow = {
    pid: number;
    unit_type: string;
    count_over_all_frames: number[];
};

type UnitLossRow = {
    frame: number;
    second: number;
    upkeep_pid: number;
    units_lost: number;
};

type PlayerMeta = {
    pid: number;
    name: string;
    sign: 1 | -1;
};

const players: PlayerMeta[] = [
    { pid: 1, name: "Reynor", sign: 1 },
    { pid: 2, name: "Serral", sign: -1 },
];

const lineComp = {
    type: "line",
    smooth: true,
    seriesLayoutBy: "row",
    stackStrategy: "samesign",
    areaStyle: {},
    symbol: "none",
} satisfies SeriesOption;

const lineLost = {
    type: "line",
    smooth: true,
    seriesLayoutBy: "row",
    symbol: "none",
    xAxisIndex: 1,
    yAxisIndex: 1,
} satisfies SeriesOption;

function formatTime(seconds: number) {
    seconds = Math.floor(seconds / 1.4)
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}


export default function UnitCompositions() {
    const { selectedAggregation, dropdown } = useAggSelector();





    const unitRows = useLiveQuery.sql<UnitCompRow>`
WITH 
frames AS (
        select distinct frame from sc2_events
),
born AS (
    select * from sc2_events where 
        event_name IN ('UnitBornEvent', 'UnitInitEvent')
        AND sc2_events.unit_type_name in (select str_id from sc2_unit_types where is_army)
),
passed AS (
    select * from sc2_events where event_name = 'UnitDiedEvent'
),
all_units AS (
    select 
        e1.unit_id,
        e1.upkeep_pid AS pid,
        e1.unit_type_name AS unit_type,
        e1.frame as born,
        e2.frame as died
    from 
        born e1
    left join passed e2
        on e1.unit_id = e2.unit_id
    where e1.upkeep_pid != 0
    AND e1.unit_type_name NOT ILIKE '%beacon%'
),
all_units_per_frame as (
    select frames.frame, all_units.pid, all_units.unit_type, all_units.unit_id, all_units.born, all_units.died, ${raw`${selectedAggregation}`} as metric
    from frames 
    join all_units 
        on frames.frame >= all_units.born and (all_units.died is null or frames.frame <= all_units.died)
    join sc2_unit_types
        on sc2_unit_types.str_id = all_units.unit_type
),

pid_and_type as (
    select distinct pid as pid, unit_type from all_units
),
pid_type_frames as (
    select pid, unit_type, frame from pid_and_type, frames
),
foo as (
    select g.pid, g.unit_type, g.frame, sum(COALESCE(a.metric, 0)) as cnt
    from pid_type_frames g 
    left join all_units_per_frame a on
        g.pid = a.pid and
        g.frame = a.frame and
        g.unit_type = a.unit_type
    group by g.pid, g.unit_type, g.frame
)
select pid, unit_type, array_agg(Array[frame, cnt] ORDER BY frame) as count_over_all_frames
from foo 
group by pid, unit_type;
`?.rows;

    const kills = useLiveQuery<any>(`
with born AS (
    select * from sc2_events where 
        event_name IN ('UnitBornEvent', 'UnitInitEvent')
        AND sc2_events.unit_type_name in (select str_id from sc2_unit_types where is_army)
),
died AS (
    select * from sc2_events where event_name = 'UnitDiedEvent'
)
select 
    born.unit_type_name as casualty,
    killer.unit_type_name as killer_type,
    count(*)
from 
    died
join
    born killer
        on killer.unit_id = died.killing_unit_id
join
    born
        on died.unit_id = born.unit_id
group by born.unit_type_name, killer.unit_type_name 
`, [])?.rows;

    const deathLocations = useLiveQuery<any>(`
with born AS (
    select * from sc2_events where 
        event_name IN ('UnitBornEvent', 'UnitInitEvent')
        AND sc2_events.unit_type_name in (select str_id from sc2_unit_types where is_army)
),
died AS (
    select * from sc2_events where event_name = 'UnitDiedEvent'
)
select /*born.upkeep_pid*/'scatter' as type, born.unit_type_name as name, array_agg(ARRAY[died.x, died.y, died.frame]) as data from died
join born on died.unit_id = born.unit_id
group by born.upkeep_pid, born.unit_type_name
`, [])?.rows;

    const buildings = useLiveQuery<any>(`
with born AS (
    select * from sc2_events where 
        event_name IN ('UnitBornEvent', 'UnitInitEvent')
        AND sc2_events.unit_type_name in (select str_id from sc2_unit_types where is_building)
)
select 
    upkeep_pid as name, 
    'scatter' as type, 
    'triangle' as symbol, 
    array_agg( json_build_object(
        'name', unit_type_name,
        'value', ARRAY[born.x, born.y, born.frame])
    ) as data from born
group by upkeep_pid
`, [])?.rows;

    if (!unitRows) return null;
    if (!kills) return null;


    const option = {
        xAxis: [{ type: "category", axisLabel: { formatter: formatFrame } }, { type: "category", gridIndex: 1, axisLabel: { formatter: formatFrame } }],
        yAxis: [{}, { gridIndex: 1 }],
        grid: [{ top: "0%", height: '30%' }, { top: "40%", height: '30%' }],
        dataZoom: [{ type: "slider", top: "75%", xAxisIndex: [0, 1] }],
        legend: legend,

        tooltip: {
            trigger: 'axis',
            confine: true,
            order: "valueDesc",
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: 'rgba(0,0,0,0.2)',
                    width: 1,
                    type: 'solid'
                }
            }
        },
        axisPointer: {
            link: [
                { xAxisIndex: [0, 1] }  // or use singleAxisIndex if you're using singleAxis
            ]
        },
        series:
            unitRows.map(row => ({
                xAxisIndex: row.pid - 1,
                yAxisIndex: row.pid - 1,
                type: "line",
                data: row.count_over_all_frames,
                stack: row.pid,
                name: row.unit_type,
                lineStyle: {
                    width: 0
                },
                showSymbol: false,
                areaStyle: {},
            }))
    };


    const option2 = {
        tooltip: {
            position: 'top'
        },
        grid: {
            height: '50%',
            top: '10%'
        },
        xAxis: {
            name: "Died",
            type: 'category',
            splitArea: {
                show: true
            },
            axisLabel: {
                rotate: 90,
                interval: 0
            },
        },
        visualMap: {
            min: Math.max(...kills.map(v => v.count)),
            max: 10,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%'
        },
        yAxis: {
            name: "Killer",
            type: 'category',
            splitArea: {
                show: true
            }
        },
        series: [
            {
                type: 'heatmap',
                data: kills.map(v => Object.values(v)),
                label: {
                    show: true
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };

    const option3 = {
        xAxis: { name: "X" },
        yAxis: { name: "Y" },
        grid: { height: "500px", width: "500px" },
        dataZoom: [{
            type: 'inside',
            xAxisIndex: 0,
            filterMode: 'none'
        },
        {
            type: 'inside',
            yAxisIndex: 0,
            filterMode: 'none'
        }],
        legend: legend,
        tooltip: {
            axisPointer: {
                type: 'cross',
                snap: true
            },
            formatter: params => {
                const { seriesName, value, name, data } = params;
                // HTML-escaping must be performed.
                // Otherwise, the rendering may be incorrect if `name` or
                // `value` contain special charactors like '<', '>', etc.
                // Additionally, unescaped strings may introduces XSS risks
                // if `name` or `value` come from untrusted sources, where
                // malicious code may be injected into that strings.
                const [x, y, frame] = value;
                return `${seriesName} died (x=${x}, y=${y}) at ${formatFrame(frame)}`
            }
        },
        series: [
            ...deathLocations,
            ...buildings.map(series => ({
                ...series,
                tooltip: {
                    formatter: params => {
                        const { seriesName, value, name, data } = params;
                        // HTML-escaping must be performed.
                        // Otherwise, the rendering may be incorrect if `name` or
                        // `value` contain special charactors like '<', '>', etc.
                        // Additionally, unescaped strings may introduces XSS risks
                        // if `name` or `value` come from untrusted sources, where
                        // malicious code may be injected into that strings.
                        const [x, y, frame] = value;
                        return `${name} (x=${x}, y=${y}) started at ${formatFrame(frame)}`
                    }
                }
            }))
        ]

    };

    return (<>
        {dropdown}
        <ReactECharts option={option} style={{ height: 700 }} />
        <ReactECharts option={option2} style={{ height: 500, width: 500 }} />
        <ReactECharts option={option3} style={{ height: 700, width: 800 }} />
    </>
    );

    function useAggSelector() {
        const [selectedAggregation, setSelectedAggregation] = useState('supply'); 

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

