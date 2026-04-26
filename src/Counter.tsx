import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { usePGlite } from "@electric-sql/pglite-react";
import type { EChartsOption, SeriesOption } from "echarts";

type UnitCompRow = {
    frame: number;
    second: number;
    upkeep_pid: number;
    unit_type_name: string;
    count: number;
};

type PlayerMeta = {
    pid: number;
    name: string;
    sign: 1 | -1;
};

const players: PlayerMeta[] = [
    { pid: 1, name: "Player 1", sign: 1 },
    { pid: 2, name: "Player 2", sign: -1 },
];

const lineBase = {
    type: "line",
    smooth: true,
    seriesLayoutBy: "row",
    stackStrategy: "samesign",
    areaStyle: {},
    symbol: "none",
} satisfies SeriesOption;

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

async function queryUnitComps(db: ReturnType<typeof usePGlite>) {
    const result = await db.query<UnitCompRow>(`
    WITH birth_events AS (
      SELECT DISTINCT ON (unit_id)
        unit_id,
        frame,
        second,
        upkeep_pid,
        unit_type_name
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
        second,
        upkeep_pid,
        unit_type_name,
        1 AS delta
      FROM birth_events

      UNION ALL

      SELECT
        d.frame,
        d.second,
        b.upkeep_pid,
        b.unit_type_name,
        -1 AS delta
      FROM sc2_events d
      JOIN birth_events b ON b.unit_id = d.unit_id
      WHERE d.event_name = 'UnitDiedEvent'
    ),

    frame_deltas AS (
      SELECT
        frame,
        MIN(second) AS second,
        upkeep_pid,
        unit_type_name,
        SUM(delta) AS delta
      FROM deltas
      GROUP BY frame, upkeep_pid, unit_type_name
    )

    SELECT
      frame,
      second,
      upkeep_pid,
      unit_type_name,
      SUM(delta) OVER (
        PARTITION BY upkeep_pid, unit_type_name
        ORDER BY frame
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      )::int AS count
    FROM frame_deltas
    ORDER BY upkeep_pid, unit_type_name, frame;
  `);

    return result.rows;
}

function buildOption(rows: UnitCompRow[]): EChartsOption {
    const playerByPid = new Map(players.map((p) => [p.pid, p]));

    const seconds = Array.from(new Set(rows.map((r) => r.second))).sort(
        (a, b) => a - b,
    );

    const source: (string | number)[][] = [
        ["product", ...seconds.map(formatTime)],
    ];

    const series: SeriesOption[] = [];
    const grouped = new Map<string, UnitCompRow[]>();

    for (const row of rows) {
        const key = `${row.upkeep_pid}:${row.unit_type_name}`;
        grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }

    // sort keys by player first, then unit type
    const sortedEntries = [...grouped.entries()].sort(([a], [b]) => {
        const [pidA, typeA] = a.split(":");
        const [pidB, typeB] = b.split(":");

        const pidDiff = Number(pidA) - Number(pidB);
        if (pidDiff !== 0) return pidDiff;

        return typeA.localeCompare(typeB);
    });

    for (const [key, group] of sortedEntries) {
        const [pidRaw, unitType] = key.split(":");
        const pid = Number(pidRaw);

        const player = playerByPid.get(pid);
        const playerName = player?.name ?? `Player ${pid}`;
        const sign = player?.sign ?? 1;

        const countBySecond = new Map(group.map((r) => [r.second, r.count]));

        let lastCount = 0;

        const values = seconds.map((second) => {
            const next = countBySecond.get(second);
            if (next !== undefined) lastCount = next;
            return lastCount * sign;
        });

        source.push([`${playerName} - ${unitType}`, ...values]);

        series.push({
            ...lineBase,
            stack: playerName,
        });
    }

    return {
        title: {
            left: "center",
            text: "Unit comps",
        },
        legend: {
            type: "scroll",
            top: 30,
        },
        dataset: {
            source,
        },
        tooltip: {
            trigger: "axis",
        },
        xAxis: {
            type: "category",
            name: "Time",
            boundaryGap: false,
        },
        yAxis: {
            name: "Unit count",
        },
        grid: {
            top: 80,
            left: 60,
            right: 30,
            bottom: 50,
        },
        series,
    };
}

export default function Counter() {
    const db = usePGlite();

    const [option, setOption] = useState<EChartsOption | null>(null);

    useEffect(() => {
        let cancelled = false;

        queryUnitComps(db).then((rows) => {
            if (!cancelled) {
                setOption(buildOption(rows));
            }
        });

        return () => {
            cancelled = true;
        };
    }, [db]);

    if (!option) return null;

    return (
        <ReactECharts
            option={option}
            style={{ width: "100%", height: 600 }}
            notMerge
            lazyUpdate
        />
    );
}