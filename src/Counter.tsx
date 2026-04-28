import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { useLiveQuery, usePGlite } from "@electric-sql/pglite-react";
import type { EChartsOption, SeriesOption } from "echarts";

type UnitCompRow = {
    pid: number;
    unit_type: string;
    countOverAllFrames: number[];
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
WITH birth_events AS (
  SELECT DISTINCT ON (unit_id)
    unit_id,
    frame,
    second,
    upkeep_pid AS pid,
    unit_type_name AS unit_type
  FROM sc2_events
  WHERE event_name IN ('UnitBornEvent', 'UnitInitEvent')
    AND unit_id IS NOT NULL
    AND upkeep_pid IS NOT NULL
    AND upkeep_pid != 0
    AND unit_type_name IS NOT NULL
    AND unit_type_name NOT ILIKE '%beacon%'
  ORDER BY unit_id, frame
),

deltas AS (
  SELECT
    frame,
    pid,
    unit_type,
    1 AS delta
  FROM birth_events

  UNION ALL

  SELECT
    d.frame,
    b.pid,
    b.unit_type,
    -1 AS delta
  FROM sc2_events d
  JOIN birth_events b ON b.unit_id = d.unit_id
  WHERE d.event_name = 'UnitDiedEvent'
),

frame_deltas AS (
  SELECT
    frame,
    pid,
    unit_type,
    SUM(delta)::int AS delta
  FROM deltas
  GROUP BY frame, pid, unit_type
),

frames AS (
  SELECT DISTINCT frame
  FROM sc2_events
),

series_keys AS (
  SELECT DISTINCT
    pid,
    unit_type
  FROM birth_events
),

expanded AS (
  SELECT
    f.frame,
    k.pid,
    k.unit_type,
    COALESCE(fd.delta, 0) AS delta
  FROM frames f
  CROSS JOIN series_keys k
  LEFT JOIN frame_deltas fd
    ON fd.frame = f.frame
   AND fd.pid = k.pid
   AND fd.unit_type = k.unit_type
),

cumulative AS (
  SELECT
    frame,
    pid,
    unit_type,
    SUM(delta) OVER (
      PARTITION BY pid, unit_type
      ORDER BY frame
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )::int AS count
  FROM expanded
)

SELECT
  pid,
  unit_type,
  array_agg(count ORDER BY frame) AS "countOverAllFrames"
FROM cumulative
GROUP BY pid, unit_type
ORDER BY pid, unit_type;
`;
const unitsLostQuery = `
WITH birth_events AS (
  SELECT DISTINCT ON (unit_id)
    unit_id, upkeep_pid, unit_type_name
  FROM sc2_events
  WHERE event_name IN ('UnitBornEvent','UnitInitEvent')
    AND upkeep_pid IS NOT NULL
    AND upkeep_pid != 0
    AND unit_type_name IS NOT NULL
    AND unit_type_name NOT ILIKE '%beacon%'
    AND unit_type_name NOT ILIKE 'larva'
  ORDER BY unit_id, frame
),
death_events AS (
  SELECT
    d.frame, d.second, b.upkeep_pid,
    COUNT(*)::int AS delta
  FROM sc2_events d
  JOIN birth_events b ON b.unit_id = d.unit_id
  WHERE d.event_name = 'UnitDiedEvent'
  GROUP BY d.frame, d.second, b.upkeep_pid
)
SELECT
  frame, second, upkeep_pid,
  SUM(delta) OVER (
    PARTITION BY upkeep_pid
    ORDER BY frame
  )::int AS units_lost
FROM death_events
ORDER BY upkeep_pid, frame;
`;


export default function Counter() {
    //const rows = useLiveQuery<UnitCompRow>("Select * from sc2_events where unit_id_index = 210", [])?.rows;
    //console.log(rows)
    //const rows2 = useLiveQuery<UnitCompRow>("Select * from sc2_events where unit_id_index = 210", [])?.rows;
    //console.log(rows2)
    //return null;
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
                data: row.countOverAllFrames,
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
