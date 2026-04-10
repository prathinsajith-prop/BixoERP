'use client'

import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

export interface ChartRendererProps {
    chart_type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
    labels: string[]
    datasets: any[]
    series?: any[]
    chart_options?: any
    height?: number
    [key: string]: any
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
    chart_type,
    labels,
    datasets: datasetsProp,
    series,
    chart_options = {},
    height = 300,
}) => {
    let ChartComponent: any
    let datasets = datasetsProp

    // Map schema-level chart_options fields → Chart.js options format
    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: chart_options.legendPosition ?? 'top',
                display: chart_options.showLegend !== false,
            },
            tooltip: { enabled: true },
        },
        ...(chart_options.scales ? { scales: chart_options.scales } : {}),
        ...(chart_options.animation !== undefined ? { animation: chart_options.animation } : {}),
    }

    // If datasets is missing but series is present, map series to datasets
    if ((!datasets || datasets.length === 0) && Array.isArray(series)) {
        datasets = series.map((s) => ({
            label: s.label,
            data: s.data || [],
            borderColor: s.color,
            backgroundColor: s.color,
            type: s.type || chart_type,
            fill: chart_type === 'area',
        }))
    }

    let data: { labels: string[]; datasets: any[] } = { labels: [], datasets: [] }

    switch (chart_type) {
        case 'line':
            ChartComponent = Line
            data = { labels, datasets }
            break
        case 'bar':
            ChartComponent = Bar
            data = { labels, datasets }
            break
        case 'pie':
            ChartComponent = Pie
            data = { labels, datasets }
            break
        case 'doughnut':
            ChartComponent = Doughnut
            data = { labels, datasets }
            break
        case 'area':
            ChartComponent = Line
            data = { labels, datasets: datasets.map((ds) => ({ ...ds, fill: true })) }
            break
        default:
            return <div className="text-red-500 text-sm">Unknown chart type</div>
    }

    const isPieType = chart_type === 'pie' || chart_type === 'doughnut'
    const maxWidth = isPieType ? (chart_options.maxWidth ?? Math.round(height * 1.4)) : undefined

    return (
        <div
            style={{
                height,
                maxWidth,
                margin: isPieType ? '0 auto' : undefined,
            }}
        >
            <ChartComponent data={data} options={options} />
        </div>
    )
}

export default ChartRenderer
