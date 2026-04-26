import type { EChartsOption } from "echarts";
import ReactECharts from 'echarts-for-react';

export default function Plotter({result}: any) {
  const sec2mins = (value) => {
          const m = value / 60;
          const s = value % 60
          return m.toFixed(0) + ":" + s.toString().padStart(2, "0")
        }

  const option1: EChartsOption = {
    xAxis: {
      type: 'value', name: "minutes", axisLabel: {
        formatter: sec2mins
      }
    },
    yAxis: { type: 'value', name: "Vespene" },
    title: { text: "Vespene Collection Rate" },
    legend: { show: true },
    series: [
      {
        data: result.playerStatsEvent.filter(e => e.pid === 1).map(e => [e.second, e.vespene_collection_rate]),
        type: 'line',
        name: "Serral"
      },
      {
        data: result.playerStatsEvent.filter(e => e.pid === 2).map(e => [e.second, e.vespene_collection_rate]),
        type: 'line',
        name: "Maru"
      }
    ]
  }

  const lookup = {}
  result.playerStatsEvent.forEach(e => {
    lookup[e.second] = {serral: null, maru: null}
  });
  result.playerStatsEvent.forEach(e => {
    if (e.pid === 1) lookup[e.second].serral = e.vespene_collection_rate
    else lookup[e.second].maru = e.vespene_collection_rate
  });
  const scatter = Object.entries(lookup).map(([t, {serral, maru}]) => [serral, maru, t])

  const _axMax = Math.max(...result.playerStatsEvent.map(e => e.vespene_collection_rate)) 
  const axMax = Math.ceil(_axMax / 500) * 500

  const option2: EChartsOption = {
    xAxis: { type: 'value', name: "Serral", max: axMax },
    yAxis: { type: 'value', name: "Maru", max: axMax },
    title: {text: "Vespene Collection Rate"},
    series: [
      {
        type: 'scatter',
        data: scatter,
        tooltip: { show: true, }
      },
    ],
    visualMap: {    
      calculable: true,
      orient: 'vertical',
      right: 10,
      top: 'center',
      min: 0,
      max: Math.max(...Object.keys(lookup)),
      formatter: sec2mins
    },
  }

  return (<div >
    <ReactECharts style={{height: "500px", width: "500px"}} option={option1} />
    <ReactECharts style={{height: "500px", width: "500px"}} option={option2} />
  </div>)
  return <>
  </>
}