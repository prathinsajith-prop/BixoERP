'use client'

/**
 * Chart Component
 * Accepts pre-built chartData or inline series/labels to render via ChartRenderer.
 * The useDataLoader hook from the monorepo fork has been removed; supply
 * charData externally (e.g., from your API layer) or use inline static datasets.
 */

import React from 'react'
import ChartRenderer from './chart-renderer'

export interface ChartProps {
    chart_type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area'
    labels?: string[]
    series?: any[]
    datasets?: any[]
    chart_options?: any
    height?: number
    title_chart?: string
    visible?: boolean
    /** Pre-fetched chart data (preferred). Keys match the series[0].key field. */
    chartData?: Record<string, any> | null
    [key: string]: any
}

export const Chart: React.FC<ChartProps> = ({
    chart_type = 'line',
    labels: staticLabels = [],
    series = [],
    datasets: staticDatasets,
    chart_options,
    height = 300,
    title_chart,
    visible = true,
    chartData,
}) => {
    if (!visible) return null

    const colors: string[] = chart_options?.colors ?? [
        '#3b82f6',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
    ]

    let resolvedLabels: string[] = staticLabels
    let datasets: any[] = staticDatasets ?? []

    if (chartData && series.length > 0) {
        const dataKey = chart_options?.dataKey ?? series[0]?.key
        const raw = dataKey ? chartData[dataKey] : null

        if (Array.isArray(raw) && raw.length > 0) {
            if (typeof raw[0] === 'object') {
                resolvedLabels = raw.map((item: any) => item.label ?? item.name ?? '')
                const values = raw.map((item: any) => item.value ?? item.count ?? 0)
                datasets = [
                    {
                        label: series[0]?.label ?? '',
                        data: values,
                        backgroundColor: colors,
                        borderColor: colors,
                    },
                ]
            } else {
                datasets = [
                    {
                        label: series[0]?.label ?? '',
                        data: raw as number[],
                        backgroundColor: colors,
                        borderColor: colors,
                    },
                ]
            }
        }
    }

    // Use series directly if no chartData
    if (!datasets.length && series.length > 0 && !chartData) {
        datasets = series.map((s, i) => ({
            label: s.label,
            data: s.data || [],
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length],
            fill: chart_type === 'area',
        }))
    }

    if (!datasets.length) {
        return <div className="p-4 text-sm text-[var(--gogo-text-secondary)]">No chart data</div>
    }

    return (
        <div className="chart-component">
            {title_chart && (
                <div className="px-4 pt-2 pb-1 text-sm font-semibold text-[var(--gogo-text-primary)]">
                    {title_chart}
                </div>
            )}
            <ChartRenderer
                chart_type={chart_type}
                labels={resolvedLabels}
                datasets={datasets}
                chart_options={chart_options}
                height={height}
            />
        </div>
    )
}

export default Chart
