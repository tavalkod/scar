import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { useLiveQuery, usePGlite } from "@electric-sql/pglite-react";
import type { EChartsOption, SeriesOption } from "echarts";

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


const unitCompQuery = `
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
    AND T.is_army = true
),
all_units_per_frame as (
    select frames.frame, all_units.pid, all_units.unit_type, all_units.unit_id, all_units.born, all_units.died
    from frames 
    join all_units 
    on frames.frame >= all_units.born and (all_units.died is null or frames.frame <= all_units.died)
),

pid_and_type as (
    select distinct pid as pid, unit_type from all_units
),
pid_type_frames as (
    select pid, unit_type, frame from pid_and_type, frames
),
foo as (
    select g.pid, g.unit_type, g.frame, count(a.*) as cnt
    from pid_type_frames g 
    left join all_units_per_frame a on
        g.pid = a.pid and
        g.frame = a.frame and
        g.unit_type = a.unit_type
    group by g.pid, g.unit_type, g.frame
)
select pid, unit_type, array_agg(cnt ORDER BY frame) as count_over_all_frames
from foo 
group by pid, unit_type;
`;


export default function Counter() {
    //const rows = useLiveQuery<UnitCompRow>("Select * from sc2_events where unit_id_index = 210", [])?.rows;
    //console.log(rows)
    //const rows2 = useLiveQuery<UnitCompRow>("Select * from sc2_events where unit_id_index = 210", [])?.rows;
    //console.log(rows2)
    //return null;
    //console.log(unitRows)
    const test = useLiveQuery<any>(`select * from sc2_events where 
        event_name IN ('UnitBornEvent', 'UnitInitEvent')
        AND sc2_events.unit_type_name in (select str_id from sc2_unit_types where is_army)`, [])?.rows;
    console.log(test)

    const unitRows = useLiveQuery<UnitCompRow>(unitCompQuery, [])?.rows;
    if (!unitRows) return null;

    const option = {
        xAxis: [{ type: "category" }, { type: "category", gridIndex: 1 }],
        yAxis: [{}, { gridIndex: 1 }],
        grid: [{ top: "0%", height: '30%' }, { top: "40%", height: '30%' }],
        dataZoom: [{type: "slider", top: "75%", xAxisIndex: [0, 1]}],
        legend: { top: "85%" },

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

    return (
        <ReactECharts option={option} style={{ height: 700 }} />
    );
    console.log(unitRows);

    //const lossRows = useLiveQuery<UnitLossRow>(unitsLostQuery, [])?.rows;

    if (!unitRows || !lossRows) return null;

    const playerByPid = new Map(players.map((p) => [p.pid, p]));

    const seconds = Array.from(
        new Set([...unitRows.map(r => r.second), ...lossRows.map(r => r.second)])
    ).sort((a, b) => a - b);

    /*const labels = seconds.map(formatTime);

    const source: (string | number)[][] = [["product", ...labels]];
    const series: SeriesOption[] = [];*/

    // ---- unit comps ----

    // ---- units lost ----
    /*const lossGrouped = new Map<number, UnitLossRow[]>();
    for (const r of lossRows) {
        lossGrouped.set(r.upkeep_pid, [...(lossGrouped.get(r.upkeep_pid) ?? []), r]);
    }

    for (const [pid, group] of [...lossGrouped.entries()].sort((a, b) => a[0] - b[0])) {
        const player = playerByPid.get(pid);
        const name = player?.name ?? `P${pid}`;

        const map = new Map(group.map(r => [r.second, r.units_lost]));
        let last = 0;

        const values = seconds.map(s => {
            const v = map.get(s);
            if (v !== undefined) last = v;
            return last;
        });

        source.push([`${name} units lost`, ...values]);
        series.push({ ...lineLost });
    }*/

    const singleAxis = {
        axisTick: {}, axisLabel: {}, type: 'category',
        axisPointer: {
            animation: true,
            label: {
                show: true
            }
        },
        splitLine: {
            show: true,
            lineStyle: {
                type: 'dashed',
                opacity: 0.2
            }
        }
    }

    const series = (pid) => (
        {
            type: 'themeRiver',
            emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.8)' } },
            data: unitRows.filter(row => row.upkeep_pid === pid).map(row => [row.frame, row.count, row.unit_type_name]),
        })

    /*const option = {
        tooltip: {
            trigger: 'axis',
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
                { singleAxisIndex: [0, 1] }  // or use singleAxisIndex if you're using singleAxis
            ]
        },
        legend: {
            top: 15
        },
        singleAxis: [
            { top: "5%", height: "30%", ...singleAxis },
            { top: "40%", height: "30%", ...singleAxis },
            { top: "70%", height: "30%", },
        ],
        series: [
            { ...series(1), singleAxisIndex: 0 },
            { ...series(2), singleAxisIndex: 1 },
        ]
    };*/

    return (
        <ReactECharts option={option} style={{ height: 700 }} />
    );
}
